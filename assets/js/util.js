export class Tooltip {
  constructor () {
    this._div = document.getElementById('tooltip')
  }

  set (x, y, offsetX, offsetY, html) {
    this._div.innerHTML = html

    // Assign display: block so that the offsetWidth is valid
    this._div.style.display = 'block'

    // Prevent the div from overflowing the page width
    const tooltipWidth = this._div.offsetWidth

    // 1.2 is a magic number used to pad the offset to ensure the tooltip
    // never gets close or surpasses the page's X width
    if (x + offsetX + (tooltipWidth * 1.2) > window.innerWidth) {
      x -= tooltipWidth
      offsetX *= -1
    }

    this._div.style.top = `${y + offsetY}px`
    this._div.style.left = `${x + offsetX}px`
  }

  hide = () => {
    this._div.style.display = 'none'
  }
}

export class Caption {
  constructor () {
    this._div = document.getElementById('status-text')
  }

  set (text) {
    this._div.innerText = text
    this._div.style.display = 'block'
  }

  hide () {
    this._div.style.display = 'none'
  }
}

export function formatTimestampSeconds (secs) {
  const date = new Date(0)
  date.setUTCSeconds(secs)
  return date.toLocaleTimeString()
}

export function formatDate (secs) {
  const date = new Date(0)
  date.setUTCSeconds(secs)
  return date.toLocaleDateString()
}

export function formatPercent (x, over) {
  const val = Math.round((x / over) * 100 * 10) / 10
  return `${val}%`
}

export function formatNumber (x) {
  if (typeof x !== 'number') {
    return '-'
  } else {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
}
