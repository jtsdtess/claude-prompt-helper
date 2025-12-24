let editingIndex = -1 // -1 означает режим добавления нового

document.addEventListener('DOMContentLoaded', () => {
  // Проверка: мы точно в расширении?
  if (typeof chrome === 'undefined' || !chrome.storage) {
    document.body.innerHTML =
      '<div style="color:red; padding:20px;">Error: Open this via the Extension Icon, not as a file!</div>'
    return
  }

  loadPrompts()
  loadSettings()

  // Основная кнопка
  const saveBtn = document.getElementById('save')
  if (saveBtn) saveBtn.addEventListener('click', saveOrUpdatePrompt)

  // --- Кнопки импорта/экспорта/синка (С БЕЗОПАСНОЙ ПРОВЕРКОЙ) ---
  const btnExport = document.getElementById('btn-export')
  if (btnExport) btnExport.addEventListener('click', exportPrompts)

  const btnImport = document.getElementById('btn-import')
  if (btnImport) btnImport.addEventListener('click', importPrompts)

  const btnSync = document.getElementById('btn-sync')
  if (btnSync) btnSync.addEventListener('click', syncFromGoogle)

  const sheetInput = document.getElementById('sheet-url')
  if (sheetInput) {
    sheetInput.addEventListener('change', (e) => {
      chrome.storage.local.set({ sheetUrl: e.target.value.trim() })
    })
  }
})

// --- ОСНОВНАЯ ЛОГИКА (SAVE / UPDATE) ---

function saveOrUpdatePrompt() {
  const titleInput = document.getElementById('title')
  const textInput = document.getElementById('text')

  const title = titleInput.value.trim()
  const text = textInput.value.trim()

  if (!title || !text) {
    alert('Please fill both Title and Text fields.')
    return
  }

  chrome.storage.local.get({ prompts: [] }, (data) => {
    const prompts = data.prompts

    if (editingIndex === -1) {
      // РЕЖИМ СОЗДАНИЯ
      prompts.push({ title, text })
    } else {
      // РЕЖИМ РЕДАКТИРОВАНИЯ
      prompts[editingIndex] = { title, text }
      editingIndex = -1
      resetButtonState()
    }

    chrome.storage.local.set({ prompts }, () => {
      titleInput.value = ''
      textInput.value = ''
      loadPrompts()
    })
  })
}

function startEdit(index) {
  chrome.storage.local.get({ prompts: [] }, (data) => {
    const prompt = data.prompts[index]
    if (prompt) {
      document.getElementById('title').value = prompt.title
      document.getElementById('text').value = prompt.text

      editingIndex = parseInt(index)

      const saveBtn = document.getElementById('save')
      saveBtn.innerText = 'Update Prompt'

      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
}

function resetButtonState() {
  const saveBtn = document.getElementById('save')
  saveBtn.innerText = 'Add Prompt' // Только текст, цвет пусть берет из CSS
}

// --- ОТРИСОВКА СПИСКА ---

function loadPrompts() {
  const list = document.getElementById('list')
  list.innerHTML = ''

  chrome.storage.local.get({ prompts: [] }, (data) => {
    if (data.prompts.length === 0) {
      list.innerHTML =
        '<div style="padding:10px; text-align:center; color:#666; font-size:12px">No prompts yet</div>'
      return
    }

    data.prompts.forEach((p, index) => {
      const div = document.createElement('div')
      div.className = 'item'
      // Используем SVG иконки из CSS (классы edit-btn и delete-btn)
      div.innerHTML = `
        <span title="${p.text}">${p.title}</span>
        <div class="actions">
          <button class="edit-btn" data-index="${index}"></button>
          <button class="delete-btn" data-index="${index}">&#10006;</button>
        </div>
      `
      list.appendChild(div)
    })

    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) =>
        startEdit(e.target.getAttribute('data-index'))
      )
    })

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) =>
        deletePrompt(e.target.getAttribute('data-index'))
      )
    })
  })
}

function deletePrompt(index) {
  if (confirm('Delete this prompt?')) {
    chrome.storage.local.get({ prompts: [] }, (data) => {
      const prompts = data.prompts
      prompts.splice(index, 1)

      if (editingIndex == index) {
        editingIndex = -1
        document.getElementById('title').value = ''
        document.getElementById('text').value = ''
        resetButtonState()
      }

      chrome.storage.local.set({ prompts }, loadPrompts)
    })
  }
}

// --- SYNC & SETTINGS ---

function loadSettings() {
  chrome.storage.local.get({ sheetUrl: '' }, (data) => {
    const input = document.getElementById('sheet-url')
    if (data.sheetUrl && input) input.value = data.sheetUrl
  })
}

function exportPrompts() {
  chrome.storage.local.get({ prompts: [] }, (data) => {
    document.getElementById('json-io').value = JSON.stringify(
      data.prompts,
      null,
      2
    )
  })
}

function importPrompts() {
  try {
    const newPrompts = JSON.parse(document.getElementById('json-io').value)
    if (Array.isArray(newPrompts)) {
      if (confirm('Overwrite existing prompts?')) {
        chrome.storage.local.set({ prompts: newPrompts }, loadPrompts)
        alert('Import successful!')
      }
    }
  } catch (e) {
    alert('Invalid JSON')
  }
}

function syncFromGoogle() {
  const url = document.getElementById('sheet-url').value.trim()
  const status = document.getElementById('sync-status')
  if (!url) {
    status.innerText = 'Error: No URL'
    status.style.color = '#f87171'
    return
  }

  status.innerText = 'Downloading...'
  status.style.color = '#fbbf24'

  fetch(url)
    .then((r) => r.text())
    .then((csvText) => {
      const newPrompts = parseCSV(csvText)
      if (newPrompts.length === 0) throw new Error('No prompts found')
      chrome.storage.local.set({ prompts: newPrompts }, () => {
        loadPrompts()
        status.innerText = `Updated ${newPrompts.length} prompts.`
        status.style.color = '#4ade80'
        setTimeout(() => {
          status.innerText = ''
        }, 3000)
      })
    })
    .catch((err) => {
      status.innerText = 'Error: ' + err.message
      status.style.color = '#f87171'
    })
}

function parseCSV(text) {
  const lines = []
  let currentLine = []
  let currentCell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentCell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentLine.push(currentCell.trim())
        currentCell = ''
      } else if (char === '\n' || char === '\r') {
        if (currentCell || currentLine.length > 0) {
          currentLine.push(currentCell.trim())
          lines.push(currentLine)
        }
        currentLine = []
        currentCell = ''
      } else {
        currentCell += char
      }
    }
  }
  if (currentCell || currentLine.length > 0) {
    currentLine.push(currentCell.trim())
    lines.push(currentLine)
  }
  const prompts = []
  const startIndex =
    lines[0] && lines[0][0] && lines[0][0].toLowerCase().includes('title')
      ? 1
      : 0
  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i]
    if (row.length >= 2 && row[0] && row[1])
      prompts.push({ title: row[0], text: row[1] })
  }
  return prompts
}
