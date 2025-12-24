const BUTTON_ID = 'claude-prompt-helper-btn'
const MODAL_ID = 'claude-prompt-helper-modal'

// Функция вставки текста
function insertPrompt(text) {
  const input = document.querySelector('div[contenteditable="true"]')
  if (!input) return

  input.focus()
  input.innerHTML = '' // Очищаем поле (опционально, можно убрать если хочешь дописывать)
  input.appendChild(document.createTextNode(text))

  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: text,
    })
  )
}

// Открытие модалки
function openModal(prompts) {
  if (document.getElementById(MODAL_ID)) return

  const modal = document.createElement('div')
  modal.id = MODAL_ID

  const backdrop = document.createElement('div')
  backdrop.className = 'backdrop'

  const box = document.createElement('div')
  box.className = 'modal'

  // Заголовок модалки (опционально, для красоты)
  const title = document.createElement('h3')
  title.innerText = 'Select a Prompt'
  title.style.margin = '0 0 10px 0'
  title.style.color = '#888'
  title.style.fontSize = '12px'
  title.style.textTransform = 'uppercase'
  title.style.letterSpacing = '1px'
  box.appendChild(title)

  if (!prompts || prompts.length === 0) {
    const emptyMsg = document.createElement('div')
    emptyMsg.innerText = 'No prompts saved yet.'
    emptyMsg.style.color = '#666'
    emptyMsg.style.fontSize = '13px'
    emptyMsg.style.textAlign = 'center'
    box.appendChild(emptyMsg)
  } else {
    prompts.forEach((p) => {
      const btn = document.createElement('button')
      btn.textContent = p.title
      btn.onclick = () => {
        insertPrompt(p.text)
        modal.remove()
      }
      box.appendChild(btn)
    })
  }

  backdrop.onclick = () => modal.remove()
  modal.appendChild(backdrop)
  modal.appendChild(box)
  document.body.appendChild(modal)
}

// Загрузка промптов
function loadPrompts(callback) {
  chrome.storage.local.get({ prompts: [] }, (data) => {
    callback(data.prompts)
  })
}

// Создание кнопки (БЕЗ ИКОНКИ)
function injectButton(sendBtn) {
  if (document.getElementById(BUTTON_ID)) return

  const btn = document.createElement('button')
  btn.id = BUTTON_ID
  btn.textContent = 'Prompts' // Убрали ⚡, оставили только текст

  // Клик по кнопке -> загрузить промпты -> открыть модалку
  btn.onclick = () => loadPrompts(openModal)

  // Вставляем кнопку ПЕРЕД кнопкой отправки (или контейнером кнопок)
  sendBtn.parentElement.prepend(btn)
}

// Observer
const observer = new MutationObserver(() => {
  const sendBtn = document.querySelector('button[aria-label="Send message"]')
  if (sendBtn) {
    injectButton(sendBtn)
  }
})

observer.observe(document.body, { childList: true, subtree: true })
