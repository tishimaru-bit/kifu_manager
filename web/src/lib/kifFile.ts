import Encoding from 'encoding-japanese'

/** KIF ファイルを文字列として読む。Shift_JIS（.kif の慣習）と UTF-8（.kifu）を自動判別する */
export async function readKifFile(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const from = Encoding.detect(bytes, ['UTF8', 'SJIS', 'EUCJP']) || 'SJIS'
  return Encoding.convert(bytes, { to: 'UNICODE', from, type: 'string' }).replace(/^\uFEFF/, '')
}

export type KifEncoding = 'sjis' | 'utf8'

/** Shift_JIS は .kif、UTF-8 は .kifu として保存させる。改行は KIF を扱う Windows ソフトに合わせて CRLF */
export function downloadKif(kifText: string, baseName: string, encoding: KifEncoding) {
  const text = kifText.replace(/\r?\n/g, '\r\n')
  const bytes =
    encoding === 'sjis'
      ? new Uint8Array(Encoding.convert(text, { to: 'SJIS', from: 'UNICODE', type: 'array' }))
      : new TextEncoder().encode(text)
  const url = URL.createObjectURL(new Blob([bytes], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeFileName(baseName)}.${encoding === 'sjis' ? 'kif' : 'kifu'}`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url))
}

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'kifu'
}

export function baseNameOf(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '')
}
