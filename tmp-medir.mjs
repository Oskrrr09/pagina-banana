import { chromium } from 'playwright'
const b=await chromium.launch()
const ctx=await b.newContext({viewport:{width:1500,height:200},locale:'es-ES'})
await ctx.addInitScript(`localStorage.setItem('banana:favorite-store-prompt','dismissed')`)
const p=await ctx.newPage()
await p.goto('http://127.0.0.1:5173/pagina-banana/',{waitUntil:'networkidle'})
const m=await p.evaluate(()=>{
  const grupo=document.querySelector('.banana-header-bar .ml-auto')
  // Los dibujos, no las cajas: es lo que se ve.
  const svgs=[...grupo.querySelectorAll('svg')].filter(s=>s.getBoundingClientRect().width>8)
  const r=(e)=>e.getBoundingClientRect()
  const huecos=[]
  for (let i=1;i<svgs.length;i++) huecos.push(Math.round(r(svgs[i]).left - r(svgs[i-1]).right))
  return { huecos, n: svgs.length }
})
console.log('huecos visibles entre dibujos, de izquierda a derecha:', m.huecos.join(' · ') + ' px')
await b.close()
