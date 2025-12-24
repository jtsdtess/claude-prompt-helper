// Configuration
const BUTTON_ID = 'claude-prompt-helper-btn'
const MODAL_ID = 'claude-prompt-helper-modal'

/**
 * Known selectors for Claude's send/submit buttons.
 * 1. "Send message" - Standard chat interface
 * 2. "Submit" - Code/Artifacts interface
 */
const SUBMIT_SELECTORS = [
  'button[aria-label="Send message"]',
  'button[aria-label="Submit"]',
]

/**
 * Inserts text into the Claude input field and triggers necessary events.
 */
function insertPrompt(text) {
  // Try to find the input field (contenteditable div)
  const input = document.querySelector('div[contenteditable="true"]')
  if (!input) return

  input.focus()

  // Optional: clear existing text
  input.innerHTML = ''

  // Insert text as a text node
  input.appendChild(document.createTextNode(text))

  // Dispatch InputEvent to notify Claude's React app
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertText',
      data: text,
    })
  )
}

/**
 * Creates and appends the modal with prompt buttons.
 */
function openModal(prompts) {
  if (document.getElementById(MODAL_ID)) return

  const modal = document.createElement('div')
  modal.id = MODAL_ID

  const backdrop = document.createElement('div')
  backdrop.className = 'backdrop'

  const box = document.createElement('div')
  box.className = 'modal'

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
    emptyMsg.innerText =
      'No prompts saved yet. Click the extension icon to add some.'
    emptyMsg.style.color = '#666'
    emptyMsg.style.fontSize = '13px'
    emptyMsg.style.textAlign = 'center'
    box.appendChild(emptyMsg)
  } else {
    prompts.forEach((p) => {
      const btn = document.createElement('button')
      btn.textContent = p.title
      btn.title = p.text
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

function loadPrompts(callback) {
  chrome.storage.local.get({ prompts: [] }, (data) => {
    callback(data.prompts)
  })
}

/**
 * Injects the "Prompts" button next to the Send button.
 */
function injectButton(sendBtn) {
  // Check if our button already exists ANYWHERE in the document
  // If it exists but is not next to the current sendBtn (e.g. page navigation),
  // we might need to move it, but usually, the old one is destroyed by React.
  if (document.getElementById(BUTTON_ID)) return

  const btn = document.createElement('button')
  btn.id = BUTTON_ID
  btn.textContent = 'Prompts'

  btn.onclick = () => loadPrompts(openModal)

  // Prepend adds it to the left of the Send button container
  if (sendBtn.parentElement) {
    // Style check: usually flex containers work well with prepend
    sendBtn.parentElement.prepend(btn)
  }
}

/**
 * Robust Observer:
 * Monitors DOM for ANY of the valid submit buttons.
 */
const observer = new MutationObserver(() => {
  // Convert array of selectors to a single comma-separated string
  const selectorString = SUBMIT_SELECTORS.join(',')
  const sendBtn = document.querySelector(selectorString)

  if (sendBtn) {
    injectButton(sendBtn)
  }
})

// Start observing
observer.observe(document.body, { childList: true, subtree: true })
