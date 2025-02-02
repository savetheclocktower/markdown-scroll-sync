const { CompositeDisposable } = require('atom');
const pathUtil = require('path');

function log (...args) {
  console.log('markdown-scroll, main:', ...args);
}

function isMarkdown (editor) {
  for (var name of ["GitHub Markdown", "CoffeeScript (Literate)"]) {
    if (editor.getGrammar()?.name === name) { return true; }
  }
  let path = editor.getPath();
  if (path) {
    const array = path.split('.'), fext = array[array.length - 1];
    if (['md', 'markdown', 'rmd'].includes(fext.toLowerCase())) { return true; }
  }
  return false;
}

class MarkdownScrlSync {

  activate(_state) {
    let prvwPkg;
    this.subs = new CompositeDisposable();

    if (!(prvwPkg = atom.packages.getLoadedPackage('markdown-preview')) &&
       !(prvwPkg = atom.packages.getLoadedPackage('markdown-preview-plus'))) {
      log('markdown preview package not found');
      return;
    }

    const viewPath = pathUtil.join(prvwPkg.path, 'lib/markdown-preview-view');
    const MarkdownPreviewView = require(viewPath);

    let paneItemSubscription = atom.workspace.observeActivePaneItem(
      (editor) => {
        if (!atom.workspace.isTextEditor(editor) || !editor.alive || !isMarkdown(editor)) {
          return;
        }
        this.stopTracking();
        for (var previewView of atom.workspace.getPaneItems()) {
          if ((previewView instanceof MarkdownPreviewView) && previewView.editor === editor) {
            this.startTracking(editor, previewView);
            break;
          }
        }
        return null;
      }
    );

    this.subs.add(paneItemSubscription);
  }

  startTracking(editor, previewView) {
    this.editor = editor;
    this.editorView = atom.views.getView(this.editor);
    this.previewEl = previewView.element;

    this.chrHgt = this.editor.getLineHeightInPixels();
    this.lastScrnRow = null;
    this.lastChrOfs  = 0;

    this.setMap();
    this.chkScroll('init');

    this.subs2 = new CompositeDisposable();

    this.subs2.add(
      this.editor.onDidStopChanging(
        () => { this.setMap(); return this.chkScroll('changed'); }
      ),
      this.editor.onDidChangeCursorPosition(
        () => this.chkScroll('cursorMoved')
      ),
      this.editorView.onDidChangeScrollTop(
        () => this.chkScroll('newtop')
      ),
      this.editor.onDidDestroy(
        () => this.stopTracking()
      )
    );
  }

  stopTracking() {
    this.subs2?.dispose();
    this.subs2 = null;
  }

  deactivate() {
    this.stopTracking();
    this.subs.dispose();
  }
}

function mix (mixinName) {
  const mixin = require(`./${mixinName}`);
  for (let [key, value] of Object.entries(mixin)) {
    MarkdownScrlSync.prototype[key] = value;
  }
}

mix('map');
mix('scroll');
mix('utils');

module.exports = new MarkdownScrlSync;
