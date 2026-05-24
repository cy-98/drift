/** @returns {import('../../core/drift-app.js').GameHud} */
export function createDomHud(refs) {
  const {
    prompt,
    speedEl,
    altEl,
    fpsEl,
    collectEl,
    targetEl,
    distEl,
    compass,
    loreToast,
    sectorEl,
    galaxyEl,
    startBtn,
  } = refs

  return {
    getViewport() {
      return { width: window.innerWidth, height: window.innerHeight }
    },

    setSpeed(text) {
      if (speedEl) speedEl.textContent = text
    },
    setAlt(text) {
      if (altEl) altEl.textContent = text
    },
    setFps(text) {
      if (fpsEl) fpsEl.textContent = text
    },
    setCollectCount(n) {
      if (collectEl) collectEl.textContent = String(n)
    },
    setTarget(text) {
      if (targetEl) targetEl.textContent = text
    },
    setDistance(text) {
      if (distEl) distEl.textContent = text
    },
    setSector(text) {
      if (sectorEl) sectorEl.textContent = text
    },
    setGalaxy(text) {
      if (galaxyEl) galaxyEl.textContent = text
    },
    applyLoreStyle(scale) {
      if (!loreToast) return
      loreToast.classList.remove('lore-sm', 'lore-md', 'lore-lg')
      const cls = scale === 'small' ? 'lore-sm' : scale === 'large' ? 'lore-lg' : 'lore-md'
      loreToast.classList.add(cls)
    },
    flashTarget(name) {
      if (!targetEl) return
      targetEl.textContent = name
      targetEl.classList.add('flash')
      setTimeout(() => targetEl.classList.remove('flash'), 400)
    },
    setCompass({ visible, x, y, transform, edge }) {
      if (!compass) return
      compass.style.opacity = visible ? '1' : '0'
      if (!visible) return
      compass.style.left = `${x}px`
      compass.style.top = `${y}px`
      compass.style.transform = transform
      compass.classList.toggle('edge', !!edge)
    },

    dismissPrompt() {
      if (!prompt || prompt.classList.contains('dismissed')) return
      prompt.classList.remove('wake-guide', 'hidden')
      prompt.classList.add('dismissed')
      prompt.setAttribute('aria-hidden', 'true')
    },
    showStartGuide() {
      if (!prompt) return
      prompt.classList.remove('hidden', 'dismissed')
      prompt.setAttribute('aria-hidden', 'false')
      prompt.classList.add('wake-guide')
      startBtn?.focus()
    },
    getPromptElement() {
      return prompt
    },
    getStartButton() {
      return startBtn
    },

    showLore(title, text) {
      if (!loreToast) return
      const strong = loreToast.querySelector('strong')
      const p = loreToast.querySelector('p')
      if (strong) strong.textContent = title
      if (p) p.textContent = text
      loreToast.classList.add('show')
    },
    hideLore() {
      loreToast?.classList.remove('show')
    },
  }
}
