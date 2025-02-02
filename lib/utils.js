/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

function log (...args) {
  console.log('markdown-scroll, utils:', ...args);
}

module.exports = {

  getVisTopHgtBot() {
    let edtBotBnd, pvwBotBnd, refLine;
    ({top: this.edtTopBnd, bottom: edtBotBnd} = this.editorView.getBoundingClientRect());

	  // Fix for issue #64, March 4, 2017
	  // Implemented by Michael Fierro (biffster@gmail.com)
	  // Super-simple fix, just remove ".shadowRoot" from the line below.
    // lineEles = @editorView.shadowRoot.querySelectorAll '.lines .line[data-screen-row]'
    const lineEles = this.editorView.querySelectorAll('.lines .line[data-screen-row]');
    const lines = [];
    for (var lineEle of Array.from(lineEles)) {
      var {top: lineTopBnd} = lineEle.getBoundingClientRect();
      lines.push([+lineEle.getAttribute('data-screen-row'), lineTopBnd]);
    }
    if (lines.length === 0) {
      // log('no visible lines in editor');
      this.scrnTopOfs = (this.scrnBotOfs = (this.pvwTopB = (this.previewTopOfs = (this.previewBotOfs = 0))));
      return;
    }
    lines.sort();
    for (refLine of Array.from(lines)) {
      if (refLine[1] >= this.edtTopBnd) { break; }
    }
    const [refRow, refTopBnd] = Array.from(refLine);
    this.scrnTopOfs = (refRow * this.chrHgt) - (refTopBnd - this.edtTopBnd);
    this.scrnHeight = edtBotBnd - this.edtTopBnd;
    this.scrnBotOfs = this.scrnTopOfs + this.scrnHeight;
    const botScrnScrollRow = this.editor.clipScreenPosition([9e9, 9e9]).row;
    this.scrnScrollHgt = (botScrnScrollRow + 1) * this.chrHgt;

    ({top: this.pvwTopBnd, bottom: pvwBotBnd} = this.previewEl.getBoundingClientRect());
    this.previewTopOfs = this.previewEl.scrollTop;
    return this.previewBotOfs = this.previewTopOfs + (pvwBotBnd - this.pvwTopBnd);
  },

  getEleTopHgtBot(ele, scrn) {
    if (scrn == null) { scrn = true; }
    const {top:eleTopBnd, bottom: eleBotBnd} = ele.getBoundingClientRect();
    const top = scrn ? this.scrnTopOfs    + (eleTopBnd - this.edtTopBnd)
                  : this.previewTopOfs + (eleTopBnd - this.pvwTopBnd);
    const hgt = eleBotBnd - eleTopBnd;
    const bot = top + hgt;
    return [top, hgt, bot];
  }
};
