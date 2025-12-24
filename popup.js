document.addEventListener('DOMContentLoaded', loadPrompts)
document.getElementById('save').addEventListener('click', savePrompt)

function savePrompt() {
  const title = document.getElementById('title').value
  const text = document.getElementById('text').value

  if (!title || !text) {
    alert('Fill both fields!')
    return
  }

  chrome.storage.local.get({ prompts: [] }, (data) => {
    const prompts = data.prompts
    prompts.push({ title, text })

    chrome.storage.local.set({ prompts }, () => {
      document.getElementById('title').value = ''
      document.getElementById('text').value = ''
      loadPrompts() // Перерисовать список
    })
  })
}

function loadPrompts() {
  const list = document.getElementById('list')
  list.innerHTML = ''

  chrome.storage.local.get({ prompts: [] }, (data) => {
    data.prompts.forEach((p, index) => {
      const div = document.createElement('div')
      div.className = 'item'
      div.innerHTML = `
        <span><b>${p.title}</b></span>
        <button class="delete-btn" data-index="${index}">X</button>
      `
      list.appendChild(div)
    })

    // Вешаем удаление
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        deletePrompt(e.target.getAttribute('data-index'))
      })
    })
  })
}

function deletePrompt(index) {
  chrome.storage.local.get({ prompts: [] }, (data) => {
    const prompts = data.prompts
    prompts.splice(index, 1)
    chrome.storage.local.set({ prompts }, loadPrompts)
  })
}
