import{n as e,r as t,t as n}from"./pdf.worker.min-BwlXptl5.js";e.workerSrc=n;async function r(e){let n=await t({data:e,useSystemFonts:!0,isEvalSupported:!1}).promise,r=[];for(let e=1;e<=n.numPages;e+=1){let t=await(await n.getPage(e)).getTextContent(),i=``,a=null;for(let e of t.items){if(!e||typeof e.str!=`string`||!e.str)continue;let t=Array.isArray(e.transform)?e.transform[5]:null;a!=null&&t!=null&&Math.abs(a-t)>2?i+=`
`:i&&!i.endsWith(`
`)&&!i.endsWith(` `)&&(i+=` `),i+=e.str,t!=null&&(a=t)}r.push(i)}return r.join(`

`)}async function i(e){let t=await e.arrayBuffer();return r(new Uint8Array(t))}export{i as extractPdfTextFromFile};