import getPerspective from './perspective.js'

// For debugging and advanced usage
window.getPerspective = getPerspective

const inputField = document.querySelector('#input-field')
const resultField = document.querySelector('#result-field')
const processBtn = document.querySelector('#process-btn')
const errorMessage = document.querySelector('.error-msg')

processBtn.addEventListener('click', evt => {
  evt.preventDefault()
  const value = inputField.value

  const clipMatch = value.match(/\\clip\([^)]+\)/)
  const posMatch = value.match(/\\pos\([^)]+\)/)
  const coord = clipMatch ? clipMatch[0] : value
  const targetOrigin = posMatch ? posMatch[0] : null

  const result = getPerspective({ coord, targetOrigin})
  errorMessage.classList.toggle('hidden', !!result.length)
  resultField.value = result.length ? result.map(e => e.tag).join('\n') : ''
  resultField.rows = Math.max(3, result.length)
})
