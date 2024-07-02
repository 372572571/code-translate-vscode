const vscode = require('vscode')
const DICTQuery = require('./query')
const formatter = require('./format')

const markdownHeader = `翻译 \`$word\` :  
`
const markdownFooter = `  
`
const markdownLine = `  
*****
`

const genMarkdown = function (word, translation, p) {
  if (!translation && !p) {
    return `- [${word}](https://translate.google.com?text=${word}) :  
本地词库暂无结果 , 查看 [Google翻译](https://translate.google.com?text=${word}) [百度翻译](https://fanyi.baidu.com/#en/zh/${word})`
  }
  //   return `- [${word}](https://translate.google.com?text=${word}) ${p ? '*/' + p + '/*' : ''}:  
  // ${translation.replace(/\\n/g, `  
  // `)}`
  return `- [${word}](https://fanyi.baidu.com/#en/zh/${word}) ${p ? '*/' + p + '/*' : ''}:  
${translation.replace(/\\n/g, `  
`)}`
}

async function init(context) {

  const extension = vscode.extensions.getExtension('uc1024.code-translate');
  if (extension) {
    // 读取 package.json 文件
    const packageJson = extension.packageJSON;
    if (packageJson) {
      console.log(packageJson.name); // 打印插件名称
      console.log(packageJson.version); // 打印插件版本
    }
  }
  vscode.languages.registerHoverProvider('*', {
    async provideHover(document, position) {
      // 获取当前插件信息
      if (!document.getWordRangeAtPosition(position)) {
        return
      }
      let word = document.getText(document.getWordRangeAtPosition(position))
      let selectText = vscode.window.activeTextEditor.document.getText(vscode.window.activeTextEditor.selection)
      if (selectText && word.indexOf(selectText) > -1) {
        word = selectText
      }
      let originText = formatter.cleanWord(word)
      let words = formatter.getWordArray(formatter.cleanWord(word))
      let hoverText = ''
      for (let i = 0; i < words.length; i++) {
        let _w = words[i]
        let ret = await DICTQuery(_w)
        if (i == 0) {
          hoverText += genMarkdown(_w, ret.w, ret.p)
        } else {
          hoverText += markdownLine + genMarkdown(_w, ret.w, ret.p)
        }
      }
      const header = markdownHeader.replace('$word', originText)
      hoverText = header + hoverText + markdownFooter
      return new vscode.Hover(hoverText)
    }
  })
}

async function initCmd(context) {
  let disposable = vscode.commands.registerCommand('uc1024.code-translate', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('No text selected');
      return;
    }

    const word = editor.document.getText(selection);
    const originText = formatter.cleanWord(word);
    const words = formatter.getWordArray(originText);
    let hoverText = '';

    for (let i = 0; i < words.length; i++) {
      let _w = words[i];
      let ret = await DICTQuery(_w);
      if (i === 0) {
        hoverText += genMarkdown(_w, ret.w, ret.p);
      } else {
        hoverText += markdownLine + genMarkdown(_w, ret.w, ret.p);
      }
    }

    const header = markdownHeader.replace('$word', originText);
    hoverText = header + hoverText + markdownFooter;

    // 创建文本编辑器装饰类型
    // const decorationType = vscode.window.createTextEditorDecorationType({
    //   after: {
    //     contentText: hoverText,
    //     margin: '20px'
    //   }
    // });

    // 获取选中文字的范围
    // const range = new vscode.Range(selection.start, selection.end);
    // 应用装饰到选中文字
    // editor.setDecorations(decorationType, [range]);

    // 下方提示
    // vscode.window.showInformationMessage(hoverText); // 使用 showInformationMessage 或者 showErrorMessage 来显示悬停内容

    // 创建临时文档并显示内容
    const document = await vscode.workspace.openTextDocument({ content: hoverText, language: 'markdown' });
    vscode.window.showTextDocument(document, { preview: false });

    // 注册悬停提供程序(不适用)
    // registerHoverProvider({ scheme: 'file'} 上下文
    // registerHoverProvider("*" 所有
    // registerHoverProvider("javascript" 特定文本
    // vscode.languages.registerHoverProvider({ scheme: 'file' }, {
    //   provideHover(document, position) {
    //     if (document.getWordRangeAtPosition(position).contains(selection.start)) {
    //       return {
    //         range: selection,
    //         contents: [
    //           { value: hoverText }
    //         ]
    //       };
    //     }
    //   }
    // });

  });

  context.subscriptions.push(disposable);
}

module.exports = {
  init,
  initCmd,
}
