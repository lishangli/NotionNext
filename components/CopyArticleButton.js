import { siteConfig } from '@/lib/config'
import { getPageCanCopy } from '@/lib/utils/copyPermission'
import { useState } from 'react'

/**
 * Copy the rendered blog article without copying site menus, ads or comments.
 * HTML is preferred so pasted content keeps headings, links, tables and images.
 */
export default function CopyArticleButton({ post }) {
  const [status, setStatus] = useState('idle')
  const canCopy = getPageCanCopy(siteConfig('CAN_COPY', true), post)

  if (!post || post.type !== 'Post' || !canCopy) return null

  const handleCopy = async () => {
    const container = document.getElementById('notion-article')
    const source =
      container?.querySelector('.notion-page-content') ||
      container?.querySelector('.notion-page') ||
      container?.querySelector('.notion')

    if (!source) {
      setStatus('error')
      return
    }

    const rich = source.cloneNode(true)
    rich.querySelectorAll(
      'button, script, style, .notion-code-copy-button, .notion-page-icon, .notion-collection-page-properties'
    ).forEach(node => node.remove())

    rich.querySelectorAll('a[href], img[src]').forEach(node => {
      const attribute = node.tagName === 'A' ? 'href' : 'src'
      const value = node.getAttribute(attribute)
      if (value && !value.startsWith('data:') && !value.startsWith('blob:')) {
        try {
          node.setAttribute(attribute, new URL(value, window.location.href).href)
        } catch (_) {
          // Keep unusual URL schemes unchanged.
        }
      }
    })

    const title = post.title || ''
    const hasTitle = title && rich.textContent?.trimStart().startsWith(title)
    const titleHtml = title && !hasTitle
      ? '<h1>' + escapeHtml(title) + '</h1>'
      : ''
    const html = titleHtml + rich.outerHTML

    const plain = rich.cloneNode(true)
    plain.querySelectorAll('.katex').forEach(node => {
      const sourceNode = node.querySelector('annotation[encoding="application/x-tex"]')
      if (!sourceNode?.textContent) return
      const isDisplay = Boolean(node.closest('.katex-display'))
      const delimiter = isDisplay ? '$$' : '$'
      node.replaceWith(document.createTextNode(
        delimiter + sourceNode.textContent + delimiter
      ))
    })

    // A connected off-screen clone preserves paragraph breaks in innerText.
    const scratch = document.createElement('div')
    scratch.style.cssText = 'position:fixed;left:-100000px;top:0;width:800px;pointer-events:none;'
    scratch.appendChild(plain)
    document.body.appendChild(scratch)
    let bodyText = ''
    try {
      bodyText = plain.innerText || plain.textContent || source.innerText || ''
    } finally {
      scratch.remove()
    }
    const text = (title && !hasTitle ? title + '\n\n' : '') + bodyText.trim()

    setStatus('copying')
    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' })
          })
        ])
      } else {
        await writePlainText(text)
      }
      setStatus('success')
    } catch (_) {
      try {
        await writePlainText(text)
        setStatus('success')
      } catch (_) {
        setStatus('error')
      }
    }
  }

  return (
    <div className='mb-4 flex items-center justify-end gap-2'>
      <button
        type='button'
        onClick={handleCopy}
        disabled={status === 'copying'}
        aria-label='一键复制博客全文'
        className='inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'>
        <span aria-hidden='true'>{status === 'success' ? '✓' : '⧉'}</span>
        {status === 'copying' ? '复制中…' : status === 'success' ? '已复制全文' : '复制全文'}
      </button>
      {status === 'error' && (
        <span role='alert' className='text-xs text-red-500'>
          复制失败，请检查浏览器剪贴板权限
        </span>
      )}
      {status === 'success' && (
        <span role='status' className='text-xs text-gray-500 dark:text-gray-400'>
          可粘贴到 Notion、文档或编辑器
        </span>
      )}
    </div>
  )
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char])
}

async function writePlainText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Copy was not permitted')
}
