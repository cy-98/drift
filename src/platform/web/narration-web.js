/** @param {() => { narration?: boolean }} getSettings */

export function createWebNarration(getSettings) {
  let voicesReady = false

  function refreshVoices() {
    voicesReady = typeof speechSynthesis !== 'undefined' && speechSynthesis.getVoices().length > 0
  }

  if (typeof speechSynthesis !== 'undefined') {
    refreshVoices()
    speechSynthesis.addEventListener('voiceschanged', refreshVoices)
  }

  function pickVoice() {
    if (!voicesReady) refreshVoices()
    const voices = speechSynthesis?.getVoices?.() ?? []
    return (
      voices.find((v) => v.lang === 'zh-CN') ||
      voices.find((v) => v.lang.startsWith('zh')) ||
      voices[0]
    )
  }

  function speak(title, text) {
    if (!getSettings().narration) return
    if (typeof speechSynthesis === 'undefined') return
    const line = [title, text].filter(Boolean).join('。')
    if (!line) return

    speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(line)
    utter.lang = 'zh-CN'
    utter.rate = 0.9
    utter.pitch = 1
    utter.volume = 0.88
    const voice = pickVoice()
    if (voice) utter.voice = voice
    speechSynthesis.speak(utter)
  }

  function cancel() {
    speechSynthesis?.cancel?.()
  }

  return { speak, cancel, supported: typeof speechSynthesis !== 'undefined' }
}
