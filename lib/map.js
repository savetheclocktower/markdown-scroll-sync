/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
/*
  lib/map.coffee
*/

function log (...args) {
  console.log('markdown-scroll, map:', ...args);
}

module.exports = {

  setMap(getVis = true) {
    let botRow, node, topRow;
    let start = Date.now();
    const timings = {};

    if (getVis) {
      this.getVisTopHgtBot();
      timings.getVisTopHgtBot = Date.now() - start;
      start = Date.now();
    }

    this.nodes = [];
    const walker = document.createTreeWalker(this.previewEl, NodeFilter.SHOW_TEXT, null, true);
    while (node = walker.nextNode()) {
      var text = node.textContent;
      if (!/\w+/.test(text)) { continue; }
      var [top, hgt, bot] = Array.from(this.getEleTopHgtBot(node.parentNode, false));
      this.nodes.push([top, bot, null, null, text, null]);
    }

    timings['tree walk'] = Date.now() - start;
    start = Date.now();

    let nodePtr = 0;
    for (
      let bufRow = 0, end = this.editor.getLastBufferRow(), asc = 0 <= end;
      asc ? bufRow <= end : bufRow >= end;
      asc ? bufRow++ : bufRow--
    ) {
      let line = this.editor.lineTextForBufferRow(bufRow);
      let matches = line.match(/[a-z0-9-\s]+/ig);
      if (!matches) continue;

      let maxLen = 0;
      let target = null;
      for (var match of Array.from(matches)) {
        if (/\w+/.test(match)) {
          match = match.replace(/^\s+|\s+$/g, '');
          if (match.length > maxLen) {
            maxLen = match.length;
            target = match;
          }
        }
      }

      if (target) {
        let idxMatch;
        let nodeMatch = null;
        let iterable = this.nodes.slice(nodePtr);
        for (let idx = 0; idx < iterable.length; idx++) {
          node = iterable[idx];
          if (node[4].includes(target)) {
            if (nodeMatch) {
              nodeMatch = 'dup';
              break;
            }
            nodeMatch = node;
            idxMatch = idx;
          }
        }
        if (!nodeMatch || (nodeMatch === 'dup')) { continue; }

        let screenRange = this.editor.screenRangeForBufferRange([ [bufRow, 0], [bufRow, 9e9] ] );
        topRow = screenRange.start.row;
        botRow = screenRange.end.row;
        nodeMatch[2] = topRow;
        nodeMatch[3] = botRow;
        nodeMatch[5] = target;  // DEBUG
        nodePtr = idxMatch;
      }
    }

    timings['node match'] = Date.now() - start; start = Date.now();

    this.map = [[0,0,0,0]];
    this.lastTopPix = (this.lastBotPix = (this.lastTopRow = (this.lastBotRow = 0)));
    let firstNode = true;

    const addNodeToMap = (node) => {
      let botPix, topPix;
      [topPix, botPix, topRow, botRow] = node;
      if ((topPix < this.lastBotPix) || (topRow <= this.lastBotRow)) {
        this.lastTopPix = Math.min(topPix, this.lastTopPix);
        this.lastBotPix = Math.max(botPix, this.lastBotPix);
        this.lastTopRow = Math.min(topRow, this.lastTopRow);
        this.lastBotRow = Math.max(botRow, this.lastBotRow);
        this.map.push([this.lastTopPix, this.lastBotPix, this.lastTopRow, this.lastBotRow]);
      } else {
        if (firstNode) {
          this.map[0][1] = topPix;
          this.map[0][3] = Math.max(0, topRow - 1);
        }
        this.map.push([topPix, botPix, topRow, botRow]);
        this.lastTopPix = topPix;
        this.lastBotPix = botPix;
        this.lastTopRow = topRow;
        this.lastBotRow = botRow;
      }
      firstNode = false;
    };

    for (let node of Array.from(this.nodes)) {
      if (node[2] !== null) {
        addNodeToMap(node);
      }
    }

    botRow = this.editor.getLastScreenRow();
    topRow = Math.min(botRow, this.lastBotRow + 1);
    addNodeToMap([this.lastBotPix, this.previewEl.scrollHeight, topRow, botRow]);

    this.nodes = null;
  }
};
