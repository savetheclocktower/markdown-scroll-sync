function log (...args) {
  console.log('markdown-scroll, scroll:', ...args);
}

module.exports = {

  chkScroll(eventType, auto) {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    if (!this.editor.alive) { this.stopTracking(); return; }

    if (eventType !== 'changed') {
      this.getVisTopHgtBot();

      if (
        this.scrnTopOfs !== this.lastScrnTopOfs ||
        this.scrnBotOfs !== this.lastScrnBotOfs ||
        this.previewTopOfs !== this.lastPvwTopOfs ||
        this.previewBotOfs !== this.lastPvwBotOfs
      ) {
        this.lastScrnTopOfs = this.scrnTopOfs;
        this.lastScrnBotOfs = this.scrnBotOfs;
        this.lastPvwTopOfs  = this.previewTopOfs;
        this.lastPvwBotOfs  = this.previewBotOfs;

        this.setMap(false);
      }
    }

    let now = Date.now();
    switch (eventType) {
      case 'init': {
        let cursorOfs = this.editor.getCursorScreenPosition().row * this.chrHgt;
        if (this.scrnTopOfs <= cursorOfs && cursorOfs <= this.scrnBotOfs) {
          this.setScroll(cursorOfs);
        } else {
          this.setScroll(this.scrnTopOfs);
        }
        break;
      }

      case 'changed':
      case 'cursorMoved':
        this.setScroll(this.editor.getCursorScreenPosition().row * this.chrHgt);
        this.ignoreScrnScrollUntil = Date.now() + 500;
        break;

      case 'newtop':
        if (this.ignoreScrnScrollUntil && (now < this.ignoreScrnScrollUntil)) {
          break;
        }
        this.ignoreScrnScrollUntil = null;
        let scrollFrac = this.scrnTopOfs / (this.scrnScrollHgt - this.scrnHeight);
        this.setScroll(this.scrnTopOfs + (this.scrnHeight * scrollFrac));
        if (!auto) {
          this.scrollTimeout = setTimeout((() => this.chkScroll('newtop', true)), 300);
        }
        break;
    }
  },

  setScroll(scrnPosPix) {
    let pix1, pix2, row1, row2;
    scrnPosPix = Math.max(0, scrnPosPix);
    let lastMapping = null;
    for (let [idx, mapping] of this.map.entries()) {
      let [topPix, botPix, topRow, botRow] = mapping;
      if (
        (topRow * this.chrHgt) <= scrnPosPix && scrnPosPix < ((botRow + 1) * this.chrHgt) ||
        idx === (this.map.length - 1)
      ) {
        row1 = topRow;
        row2 = botRow + 1;
        pix1 = topPix;
        pix2 = botPix;
        break;
      } else {
        if (lastMapping == null) { lastMapping = mapping; }
        let lastBotPix = lastMapping[1];
        let lastBotRow = lastMapping[3] + 1;
        if ((lastBotRow * this.chrHgt) <= scrnPosPix && scrnPosPix < (topRow * this.chrHgt)) {
          row1 = lastBotRow;
          row2 = topRow;
          pix1 = lastBotPix;
          pix2 = topPix;
          break;
        }
      }
      lastMapping = mapping;
    }

    const spanFrac = (scrnPosPix - (row1 * this.chrHgt)) / ((row2 - row1) * this.chrHgt);
    const visOfs =  scrnPosPix - this.scrnTopOfs;
    const pvwPosPix = pix1 + ((pix2 - pix1) * spanFrac);
    this.previewEl.scrollTop = pvwPosPix - visOfs;
  }
};
