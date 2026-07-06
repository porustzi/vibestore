import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const contentPath = join(root, 'content', 'products', 'products.json')
const outputPath = join(root, 'src', 'data', 'products.js')

try {
  if (!existsSync(contentPath)) {
    console.log('No content/products/products.json found, skipping transform')
    process.exit(0)
  }

  const raw = readFileSync(contentPath, 'utf-8')
  const products = JSON.parse(raw)

  if (!Array.isArray(products) || products.length === 0) {
    console.log('products.json is empty or invalid, skipping')
    process.exit(0)
  }

  const js = `export const defaultProducts = ${JSON.stringify(products, null, 2)}\n`

  const dir = dirname(outputPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  writeFileSync(outputPath, js, 'utf-8')
  console.log(`Transformed ${products.length} products → src/data/products.js`)
} catch (err) {
  console.error('Transform error:', err.message)
  process.exit(1)
}
