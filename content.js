// Configuration
const MODAL_ID = 'claude-prompt-helper-modal'

/**
 * Inserts text into the specific input field associated with the clicked button.
 */
function insertPrompt(text, targetInput) {
  if (!targetInput) {
    console.error('Claude Extension: No target input found for this button.')
    alert('Error: Could not find the chat input for this specific panel.')
    return
  }

  targetInput.focus()

  // Handle Textarea (Used in /code view)
  if (targetInput.tagName === 'TEXTAREA') {
    const originalValue = targetInput.value
    targetInput.value = text

    // Resize textarea height
    targetInput.style.height = 'auto'
    targetInput.style.height = targetInput.scrollHeight + 'px'

    targetInput.dispatchEvent(new Event('input', { bubbles: true }))
    targetInput.dispatchEvent(new Event('change', { bubbles: true }))
  }
  // Handle ContentEditable (Standard Chat & /new page)
  else {
    // Clear existing content (like the <p><br></p> placeholder)
    targetInput.innerHTML = ''

    // Create a paragraph for the text (Claude likes <p> tags in contenteditable)
    const p = document.createElement('p')
    p.textContent = text
    targetInput.appendChild(p)

    // Trigger input event
    targetInput.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        inputType: 'insertText',
        data: text,
      })
    )
  }
}

/**
 * Creates the modal.
 */
function openModal(prompts, targetInput) {
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
    emptyMsg.innerText = 'No prompts saved. Add via extension icon.'
    emptyMsg.style.color = '#666'
    emptyMsg.style.fontSize = '13px'
    emptyMsg.style.textAlign = 'center'
    box.appendChild(emptyMsg)
  } else {
    prompts.forEach((p) => {
      const btn = document.createElement('button')
      btn.textContent = p.title
      btn.title = p.text
      btn.type = 'button'
      btn.onclick = () => {
        insertPrompt(p.text, targetInput)
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
 * SMART SEARCH for the Input Field.
 * Updated to support <fieldset> and data-testid used in /new layout
 */
function findRelatedInput(sendBtn) {
  // 1. Look for the closest container up the tree
  // Added 'fieldset' for /new page support
  const container =
    sendBtn.closest('fieldset') ||
    sendBtn.closest('form') ||
    sendBtn.closest('.group')

  if (!container) return null

  // 2. Search for the best input candidate inside this container
  // Priority:
  // A. [data-testid="chat-input"] (Specific for /new page)
  // B. textarea (Code view)
  // C. contenteditable (Fallback)
  return container.querySelector(
    '[data-testid="chat-input"], textarea, div[contenteditable="true"]'
  )
}

/**
 * Injects the "Prompts" button next to a specific Send button.
 */
function injectButton(sendBtn) {
  if (sendBtn.parentElement.querySelector('.claude-prompt-helper-btn-instance'))
    return

  const btn = document.createElement('button')
  btn.className = 'claude-prompt-helper-btn-instance'
  btn.textContent = 'Prompts'
  btn.type = 'button'

  // Inline styles for consistency
  Object.assign(btn.style, {
    marginRight: '8px',
    padding: '0 12px',
    height: '32px',
    background: 'transparent',
    border: '1px solid #4b4b4b',
    borderRadius: '8px',
    color: '#e5e5e5',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  })

  btn.onmouseover = () => {
    btn.style.background = '#2a2a2a'
    btn.style.borderColor = '#666'
  }
  btn.onmouseout = () => {
    btn.style.background = 'transparent'
    btn.style.borderColor = '#4b4b4b'
  }

  btn.onclick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Find input relative to THIS button instance
    const targetInput = findRelatedInput(sendBtn)

    if (targetInput) {
      loadPrompts((prompts) => openModal(prompts, targetInput))
    } else {
      console.error(
        'Claude Extension: Could not find input. HTML Structure changed?'
      )
      // Fallback: try global search if relative search failed (last resort)
      const fallbackInput = document.querySelector(
        'div[contenteditable="true"], textarea'
      )
      if (fallbackInput) {
        console.log('Claude Extension: Using fallback global input')
        loadPrompts((prompts) => openModal(prompts, fallbackInput))
      } else {
        alert('Error: Could not find chat input.')
      }
    }
  }

  if (sendBtn.parentElement) {
    sendBtn.parentElement.prepend(btn)
  }
}

/**
 * Observer that finds ALL submit buttons
 */
const observer = new MutationObserver(() => {
  const buttons = document.querySelectorAll(
    'button[aria-label="Submit"], button[aria-label="Send message"]'
  )
  buttons.forEach(injectButton)
})

observer.observe(document.body, { childList: true, subtree: true })
