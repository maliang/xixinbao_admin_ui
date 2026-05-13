import{B as e,C as t,Ct as n,E as r,H as i,Q as a,W as o,_ as s,b as c,c as l,d as u,dt as d,et as f,g as p,k as m,q as h,tt as g,v as _,w as v,y,yt as b}from"./vue.runtime.esm-bundler-CNzWOCQx.js";import{$i as x,$n as ee,$t as S,Bt as te,Dr as C,Ea as w,Er as T,Ga as E,Io as D,Mo as O,Mr as ne,Nn as re,Nr as ie,Or as ae,Po as k,Qi as A,Qr as j,R as oe,Rt as se,Si as ce,Ta as le,Tr as ue,Zi as M,ca as N,ci as P,ct as de,ea as F,gi as I,h as fe,jo as L,oa as R,oi as z,tn as pe,zo as B}from"./router-D14bnegb.js";import{n as V,t as H}from"./Grid-C4Qhrx4K.js";import{t as me}from"./Pagination-CyUJ-zuU.js";import{n as he,t as ge}from"./CollapseItem-DvuGp9fI.js";import{t as _e}from"./DatePicker-DSR8Fj4o.js";import{n as U,t as W}from"./RadioGroup-DBNiahbQ.js";import{t as ve}from"./composables-DV_Ry7pa.js";import{t as G}from"./Space-CAX_aFSb.js";import{t as K}from"./light-Pm_qnYCM.js";import{t as ye}from"./ImageUpload-CqnoIZWW.js";var q={success:m(A,null),error:m(F,null),warning:m(M,null),info:m(x,null)},be=r({name:`ProgressCircle`,props:{clsPrefix:{type:String,required:!0},status:{type:String,required:!0},strokeWidth:{type:Number,required:!0},fillColor:[String,Object],railColor:String,railStyle:[String,Object],percentage:{type:Number,default:0},offsetDegree:{type:Number,default:0},showIndicator:{type:Boolean,required:!0},indicatorTextColor:String,unit:String,viewBoxWidth:{type:Number,required:!0},gapDegree:{type:Number,required:!0},gapOffsetDegree:{type:Number,default:0}},setup(e,{slots:t}){let n=p(()=>{let t=`gradient`,{fillColor:n}=e;return typeof n==`object`?`${t}-${B(JSON.stringify(n))}`:t});function r(t,r,i,a){let{gapDegree:o,viewBoxWidth:s,strokeWidth:c}=e,l=50+c/2,u=`M ${l},${l} m 0,50
      a 50,50 0 1 1 0,-100
      a 50,50 0 1 1 0,100`,d=Math.PI*2*50;return{pathString:u,pathStyle:{stroke:a===`rail`?i:typeof e.fillColor==`object`?`url(#${n.value})`:i,strokeDasharray:`${Math.min(t,100)/100*(d-o)}px ${s*8}px`,strokeDashoffset:`-${o/2}px`,transformOrigin:r?`center`:void 0,transform:r?`rotate(${r}deg)`:void 0}}}let i=()=>{let t=typeof e.fillColor==`object`,r=t?e.fillColor.stops[0]:``,i=t?e.fillColor.stops[1]:``;return t&&m(`defs`,null,m(`linearGradient`,{id:n.value,x1:`0%`,y1:`100%`,x2:`100%`,y2:`0%`},m(`stop`,{offset:`0%`,"stop-color":r}),m(`stop`,{offset:`100%`,"stop-color":i})))};return()=>{let{fillColor:n,railColor:a,strokeWidth:o,offsetDegree:s,status:c,percentage:l,showIndicator:u,indicatorTextColor:d,unit:f,gapOffsetDegree:p,clsPrefix:h}=e,{pathString:g,pathStyle:_}=r(100,0,a,`rail`),{pathString:v,pathStyle:y}=r(l,s,n,`fill`),b=100+o;return m(`div`,{class:`${h}-progress-content`,role:`none`},m(`div`,{class:`${h}-progress-graph`,"aria-hidden":!0},m(`div`,{class:`${h}-progress-graph-circle`,style:{transform:p?`rotate(${p}deg)`:void 0}},m(`svg`,{viewBox:`0 0 ${b} ${b}`},i(),m(`g`,null,m(`path`,{class:`${h}-progress-graph-circle-rail`,d:g,"stroke-width":o,"stroke-linecap":`round`,fill:`none`,style:_})),m(`g`,null,m(`path`,{class:[`${h}-progress-graph-circle-fill`,l===0&&`${h}-progress-graph-circle-fill--empty`],d:v,"stroke-width":o,"stroke-linecap":`round`,fill:`none`,style:y}))))),u?m(`div`,null,t.default?m(`div`,{class:`${h}-progress-custom-content`,role:`none`},t.default()):c===`default`?m(`div`,{class:`${h}-progress-text`,style:{color:d},role:`none`},m(`span`,{class:`${h}-progress-text__percentage`},l),m(`span`,{class:`${h}-progress-text__unit`},f)):m(`div`,{class:`${h}-progress-icon`,"aria-hidden":!0},m(R,{clsPrefix:h},{default:()=>q[c]}))):null)}}}),xe={success:m(A,null),error:m(F,null),warning:m(M,null),info:m(x,null)},Se=r({name:`ProgressLine`,props:{clsPrefix:{type:String,required:!0},percentage:{type:Number,default:0},railColor:String,railStyle:[String,Object],fillColor:[String,Object],status:{type:String,required:!0},indicatorPlacement:{type:String,required:!0},indicatorTextColor:String,unit:{type:String,default:`%`},processing:{type:Boolean,required:!0},showIndicator:{type:Boolean,required:!0},height:[String,Number],railBorderRadius:[String,Number],fillBorderRadius:[String,Number]},setup(e,{slots:t}){let n=p(()=>E(e.height)),r=p(()=>typeof e.fillColor==`object`?`linear-gradient(to right, ${e.fillColor?.stops[0]} , ${e.fillColor?.stops[1]})`:e.fillColor),i=p(()=>e.railBorderRadius===void 0?e.height===void 0?``:E(e.height,{c:.5}):E(e.railBorderRadius)),a=p(()=>e.fillBorderRadius===void 0?e.railBorderRadius===void 0?e.height===void 0?``:E(e.height,{c:.5}):E(e.railBorderRadius):E(e.fillBorderRadius));return()=>{let{indicatorPlacement:o,railColor:s,railStyle:c,percentage:l,unit:u,indicatorTextColor:d,status:f,showIndicator:p,processing:h,clsPrefix:g}=e;return m(`div`,{class:`${g}-progress-content`,role:`none`},m(`div`,{class:`${g}-progress-graph`,"aria-hidden":!0},m(`div`,{class:[`${g}-progress-graph-line`,{[`${g}-progress-graph-line--indicator-${o}`]:!0}]},m(`div`,{class:`${g}-progress-graph-line-rail`,style:[{backgroundColor:s,height:n.value,borderRadius:i.value},c]},m(`div`,{class:[`${g}-progress-graph-line-fill`,h&&`${g}-progress-graph-line-fill--processing`],style:{maxWidth:`${e.percentage}%`,background:r.value,height:n.value,lineHeight:n.value,borderRadius:a.value}},o===`inside`?m(`div`,{class:`${g}-progress-graph-line-indicator`,style:{color:d}},t.default?t.default():`${l}${u}`):null)))),p&&o===`outside`?m(`div`,null,t.default?m(`div`,{class:`${g}-progress-custom-content`,style:{color:d},role:`none`},t.default()):f===`default`?m(`div`,{role:`none`,class:`${g}-progress-icon ${g}-progress-icon--as-text`,style:{color:d}},l,u):m(`div`,{class:`${g}-progress-icon`,"aria-hidden":!0},m(R,{clsPrefix:g},{default:()=>xe[f]}))):null)}}});function J(e,t,n=100){return`m ${n/2} ${n/2-e} a ${e} ${e} 0 1 1 0 ${2*e} a ${e} ${e} 0 1 1 0 -${2*e}`}var Y=r({name:`ProgressMultipleCircle`,props:{clsPrefix:{type:String,required:!0},viewBoxWidth:{type:Number,required:!0},percentage:{type:Array,default:[0]},strokeWidth:{type:Number,required:!0},circleGap:{type:Number,required:!0},showIndicator:{type:Boolean,required:!0},fillColor:{type:Array,default:()=>[]},railColor:{type:Array,default:()=>[]},railStyle:{type:Array,default:()=>[]}},setup(e,{slots:t}){let n=p(()=>e.percentage.map((t,n)=>`${Math.PI*t/100*(e.viewBoxWidth/2-e.strokeWidth/2*(1+2*n)-e.circleGap*n)*2}, ${e.viewBoxWidth*8}`)),r=(t,n)=>{let r=e.fillColor[n],i=typeof r==`object`?r.stops[0]:``,a=typeof r==`object`?r.stops[1]:``;return typeof e.fillColor[n]==`object`&&m(`linearGradient`,{id:`gradient-${n}`,x1:`100%`,y1:`0%`,x2:`0%`,y2:`100%`},m(`stop`,{offset:`0%`,"stop-color":i}),m(`stop`,{offset:`100%`,"stop-color":a}))};return()=>{let{viewBoxWidth:i,strokeWidth:a,circleGap:o,showIndicator:s,fillColor:c,railColor:l,railStyle:u,percentage:d,clsPrefix:f}=e;return m(`div`,{class:`${f}-progress-content`,role:`none`},m(`div`,{class:`${f}-progress-graph`,"aria-hidden":!0},m(`div`,{class:`${f}-progress-graph-circle`},m(`svg`,{viewBox:`0 0 ${i} ${i}`},m(`defs`,null,d.map((e,t)=>r(e,t))),d.map((e,t)=>m(`g`,{key:t},m(`path`,{class:`${f}-progress-graph-circle-rail`,d:J(i/2-a/2*(1+2*t)-o*t,a,i),"stroke-width":a,"stroke-linecap":`round`,fill:`none`,style:[{strokeDashoffset:0,stroke:l[t]},u[t]]}),m(`path`,{class:[`${f}-progress-graph-circle-fill`,e===0&&`${f}-progress-graph-circle-fill--empty`],d:J(i/2-a/2*(1+2*t)-o*t,a,i),"stroke-width":a,"stroke-linecap":`round`,fill:`none`,style:{strokeDasharray:n.value[t],strokeDashoffset:0,stroke:typeof c[t]==`object`?`url(#gradient-${t})`:c[t]}})))))),s&&t.default?m(`div`,null,m(`div`,{class:`${f}-progress-text`},t.default())):null)}}}),X=L([O(`progress`,{display:`inline-block`},[O(`progress-icon`,`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 `),k(`line`,`
 width: 100%;
 display: block;
 `,[O(`progress-content`,`
 display: flex;
 align-items: center;
 `,[O(`progress-graph`,{flex:1})]),O(`progress-custom-content`,{marginLeft:`14px`}),O(`progress-icon`,`
 width: 30px;
 padding-left: 14px;
 height: var(--n-icon-size-line);
 line-height: var(--n-icon-size-line);
 font-size: var(--n-icon-size-line);
 `,[k(`as-text`,`
 color: var(--n-text-color-line-outer);
 text-align: center;
 width: 40px;
 font-size: var(--n-font-size);
 padding-left: 4px;
 transition: color .3s var(--n-bezier);
 `)])]),k(`circle, dashboard`,{width:`120px`},[O(`progress-custom-content`,`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `),O(`progress-text`,`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: inherit;
 font-size: var(--n-font-size-circle);
 color: var(--n-text-color-circle);
 font-weight: var(--n-font-weight-circle);
 transition: color .3s var(--n-bezier);
 white-space: nowrap;
 `),O(`progress-icon`,`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: var(--n-icon-color);
 font-size: var(--n-icon-size-circle);
 `)]),k(`multiple-circle`,`
 width: 200px;
 color: inherit;
 `,[O(`progress-text`,`
 font-weight: var(--n-font-weight-circle);
 color: var(--n-text-color-circle);
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 transition: color .3s var(--n-bezier);
 `)]),O(`progress-content`,{position:`relative`}),O(`progress-graph`,{position:`relative`},[O(`progress-graph-circle`,[L(`svg`,{verticalAlign:`bottom`}),O(`progress-graph-circle-fill`,`
 stroke: var(--n-fill-color);
 transition:
 opacity .3s var(--n-bezier),
 stroke .3s var(--n-bezier),
 stroke-dasharray .3s var(--n-bezier);
 `,[k(`empty`,{opacity:0})]),O(`progress-graph-circle-rail`,`
 transition: stroke .3s var(--n-bezier);
 overflow: hidden;
 stroke: var(--n-rail-color);
 `)]),O(`progress-graph-line`,[k(`indicator-inside`,[O(`progress-graph-line-rail`,`
 height: 16px;
 line-height: 16px;
 border-radius: 10px;
 `,[O(`progress-graph-line-fill`,`
 height: inherit;
 border-radius: 10px;
 `),O(`progress-graph-line-indicator`,`
 background: #0000;
 white-space: nowrap;
 text-align: right;
 margin-left: 14px;
 margin-right: 14px;
 height: inherit;
 font-size: 12px;
 color: var(--n-text-color-line-inner);
 transition: color .3s var(--n-bezier);
 `)])]),k(`indicator-inside-label`,`
 height: 16px;
 display: flex;
 align-items: center;
 `,[O(`progress-graph-line-rail`,`
 flex: 1;
 transition: background-color .3s var(--n-bezier);
 `),O(`progress-graph-line-indicator`,`
 background: var(--n-fill-color);
 font-size: 12px;
 transform: translateZ(0);
 display: flex;
 vertical-align: middle;
 height: 16px;
 line-height: 16px;
 padding: 0 10px;
 border-radius: 10px;
 position: absolute;
 white-space: nowrap;
 color: var(--n-text-color-line-inner);
 transition:
 right .2s var(--n-bezier),
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),O(`progress-graph-line-rail`,`
 position: relative;
 overflow: hidden;
 height: var(--n-rail-height);
 border-radius: 5px;
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 `,[O(`progress-graph-line-fill`,`
 background: var(--n-fill-color);
 position: relative;
 border-radius: 5px;
 height: inherit;
 width: 100%;
 max-width: 0%;
 transition:
 background-color .3s var(--n-bezier),
 max-width .2s var(--n-bezier);
 `,[k(`processing`,[L(`&::after`,`
 content: "";
 background-image: var(--n-line-bg-processing);
 animation: progress-processing-animation 2s var(--n-bezier) infinite;
 `)])])])])])]),L(`@keyframes progress-processing-animation`,`
 0% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 100%;
 opacity: 1;
 }
 66% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 100% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 `)]),Ce=r({name:`Progress`,props:Object.assign(Object.assign({},N.props),{processing:Boolean,type:{type:String,default:`line`},gapDegree:Number,gapOffsetDegree:Number,status:{type:String,default:`default`},railColor:[String,Array],railStyle:[String,Array],color:[String,Array,Object],viewBoxWidth:{type:Number,default:100},strokeWidth:{type:Number,default:7},percentage:[Number,Array],unit:{type:String,default:`%`},showIndicator:{type:Boolean,default:!0},indicatorPosition:{type:String,default:`outside`},indicatorPlacement:{type:String,default:`outside`},indicatorTextColor:String,circleGap:{type:Number,default:1},height:Number,borderRadius:[String,Number],fillBorderRadius:[String,Number],offsetDegree:Number}),setup(e){let t=p(()=>e.indicatorPlacement||e.indicatorPosition),n=p(()=>{if(e.gapDegree||e.gapDegree===0)return e.gapDegree;if(e.type===`dashboard`)return 75}),{mergedClsPrefixRef:r,inlineThemeDisabled:i}=w(e),a=N(`Progress`,`-progress`,X,K,e,r),o=p(()=>{let{status:t}=e,{common:{cubicBezierEaseInOut:n},self:{fontSize:r,fontSizeCircle:i,railColor:o,railHeight:s,iconSizeCircle:c,iconSizeLine:l,textColorCircle:u,textColorLineInner:d,textColorLineOuter:f,lineBgProcessing:p,fontWeightCircle:m,[D(`iconColor`,t)]:h,[D(`fillColor`,t)]:g}}=a.value;return{"--n-bezier":n,"--n-fill-color":g,"--n-font-size":r,"--n-font-size-circle":i,"--n-font-weight-circle":m,"--n-icon-color":h,"--n-icon-size-circle":c,"--n-icon-size-line":l,"--n-line-bg-processing":p,"--n-rail-color":o,"--n-rail-height":s,"--n-text-color-circle":u,"--n-text-color-line-inner":d,"--n-text-color-line-outer":f}}),s=i?le(`progress`,p(()=>e.status[0]),o,e):void 0;return{mergedClsPrefix:r,mergedIndicatorPlacement:t,gapDeg:n,cssVars:i?void 0:o,themeClass:s?.themeClass,onRender:s?.onRender}},render(){let{type:e,cssVars:t,indicatorTextColor:n,showIndicator:r,status:i,railColor:a,railStyle:o,color:s,percentage:c,viewBoxWidth:l,strokeWidth:u,mergedIndicatorPlacement:d,unit:f,borderRadius:p,fillBorderRadius:h,height:g,processing:_,circleGap:v,mergedClsPrefix:y,gapDeg:b,gapOffsetDegree:x,themeClass:ee,$slots:S,onRender:te}=this;return te?.(),m(`div`,{class:[ee,`${y}-progress`,`${y}-progress--${e}`,`${y}-progress--${i}`],style:t,"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":c,role:e===`circle`||e===`line`||e===`dashboard`?`progressbar`:`none`},e===`circle`||e===`dashboard`?m(be,{clsPrefix:y,status:i,showIndicator:r,indicatorTextColor:n,railColor:a,fillColor:s,railStyle:o,offsetDegree:this.offsetDegree,percentage:c,viewBoxWidth:l,strokeWidth:u,gapDegree:b===void 0?e===`dashboard`?75:0:b,gapOffsetDegree:x,unit:f},S):e===`line`?m(Se,{clsPrefix:y,status:i,showIndicator:r,indicatorTextColor:n,railColor:a,fillColor:s,railStyle:o,percentage:c,processing:_,indicatorPlacement:d,unit:f,fillBorderRadius:h,railBorderRadius:p,height:g},S):e===`multiple-circle`?m(Y,{clsPrefix:y,strokeWidth:u,railColor:a,fillColor:s,railStyle:o,viewBoxWidth:l,percentage:c,showIndicator:r,circleGap:v},S):null)}}),we={class:`p-16px`},Te={class:`flex items-center justify-between mb-16px`},Ee={class:`flex justify-end gap-8px mt-12px`},De={class:`flex flex-col gap-12px`},Oe={class:`flex items-center`},ke={class:`text-left flex-1`},Ae={class:`text-13px font-medium`},je={class:`text-13px`},Me={class:`min-w-0`,style:{flex:`2`}},Ne={class:`text-15px font-bold mt-4px truncate`},Pe={class:`text-12px op-50 mt-2px truncate`},Fe={class:`text-center flex-1`},Ie={class:`text-16px font-bold`},Le={class:`text-center flex-1`},Re={class:`flex items-center justify-center gap-4px mt-4px`},ze={class:`text-13px font-medium text-primary`},Be={class:`text-center flex-1`},Ve={class:`text-15px font-bold text-primary`},He={class:`text-center flex-1`},Ue={class:`text-14px font-medium`},We={class:`text-center flex-1`},Ge={class:`text-center flex-1`},Ke={class:`text-14px font-medium`},qe={class:`flex flex-col items-center gap-4px flex-1`},Je={class:`flex items-center gap-4px`},Ye={class:`flex items-center gap-4px`},Xe={class:`flex flex-col items-center gap-4px flex-1`},Ze={class:`text-12px op-50`},Qe={key:0,class:`text-center py-40px op-40`},$e={class:`flex items-center justify-between mt-16px`},et={class:`text-13px op-50`},tt={class:`flex gap-8px w-full`},Z=r({name:`project_list`,__name:`index`,setup(r){let m=ve(),x=d(``),w=d(`all`),E=d(`all`),D=d(`all`),O=d([{label:`全部`,value:`all`}]),k=[{label:`全部`,value:`all`},{label:`投资中`,value:`investing`},{label:`已满额`,value:`full`},{label:`已结束`,value:`ended`}],A=d([{label:`全部`,value:`all`}]),le=p(()=>O.value.filter(e=>e.value!==`all`)),M=p(()=>A.value.filter(e=>e.value!==`all`));async function N(){let[e,t]=await Promise.all([S({page_size:100}),se({page_size:100})]);!e.error&&e.data&&(O.value=[{label:`全部`,value:`all`},...(e.data.list||e.data||[]).map(e=>({label:e.name,value:String(e.id)}))]),!t.error&&t.data&&(A.value=[{label:`全部`,value:`all`},...(t.data.list||t.data||[]).map(e=>({label:e.name,value:String(e.id)}))])}let F=d(!1),L=d(1),R=d(10),B=d(0),K=d([]),q={investing:{label:`投资中`,type:`success`},full:{label:`已满额`,type:`warning`},ended:{label:`已结束`,type:`default`}},be={day:`天`,workday:`工作日`,month:`月`,自然日:`天`,工作日:`工作日`,月:`月`};function xe(e){return q[e]?.label||e}function Se(e){return q[e]?.type||`default`}function J(e){let t=be[e.periodUnit]||e.periodUnit||``;return`${e.periodValue||``}${t}`}let Y=d(!1),X=d(!1),Z=d(null),nt=()=>({categoryId:null,sort:null,minLevelId:null,name:``,subtitle:``,guarantorId:null,scale:null,amountTip:``,progress:null,autoProgress:!1,returnMultiple:null,periodValue:null,periodUnit:`day`,projectReturn:!1,status:`investing`,publishedAt:null,image:``,couponType:``,interestType:``,description:``,minAmount:null,maxAmount:null,investorCount:null,returnMethod:`按天付收益到期还本`,canRepeatInvest:!0,repeatInvestTimes:null,profitRate:null,subInvestType:`system`,level1Rate:null,level2Rate:null,level3Rate:null}),Q=d(nt()),rt=d([]);async function it(){let{data:e,error:t}=await te();if(!t&&e){let t=e.list||e||[];rt.value=(Array.isArray(t)?t:[]).map(e=>({label:e.name,value:String(e.id)}))}}let at=[{label:`自然日`,value:`day`},{label:`工作日`,value:`workday`},{label:`月`,value:`month`}],ot=[{label:`投资中`,value:`investing`},{label:`已满额`,value:`full`},{label:`已结束`,value:`ended`}],st=[{label:`按天付收益到期还本`,value:`按天付收益到期还本`},{label:`到期一次性还本付息`,value:`到期一次性还本付息`}],ct=[{label:`系统比例`,value:`system`},{label:`自定义比例`,value:`custom`}],lt=[{label:`不使用优惠券`,value:``},{label:`满减券`,value:`满减券`},{label:`折扣券`,value:`折扣券`}],ut=[{label:`不使用加息券`,value:``},{label:`加息0.5%`,value:`加息0.5%`},{label:`加息1%`,value:`加息1%`}];function dt(e){e?(X.value=!0,Z.value=e.id,Q.value={categoryId:e.categoryId?String(e.categoryId):null,sort:e.sort,minLevelId:e.minLevelId?String(e.minLevelId):null,name:e.name||``,subtitle:e.subtitle||``,guarantorId:e.guarantorId?String(e.guarantorId):null,scale:e.scale?e.scale/1e4:null,amountTip:e.amountTip||``,progress:e.progress,autoProgress:!!e.autoProgress,returnMultiple:e.returnMultiple,periodValue:e.periodValue,periodUnit:e.periodUnit||`day`,projectReturn:!!e.projectReturn,status:e.status||`investing`,publishedAt:e.publishedAt?new Date(e.publishedAt).getTime():null,image:e.image||``,couponType:e.couponType||``,interestType:e.interestType||``,description:e.description||``,minAmount:e.minAmount?e.minAmount/1e4:null,maxAmount:e.maxAmount?e.maxAmount/1e4:null,investorCount:e.investorCount,returnMethod:e.returnMethod||`按天付收益到期还本`,canRepeatInvest:e.canRepeatInvest!==!1,repeatInvestTimes:e.repeatInvestTimes,profitRate:e.profitRate,subInvestType:e.subInvestType||`system`,level1Rate:e.level1Rate,level2Rate:e.level2Rate,level3Rate:e.level3Rate}):(X.value=!1,Z.value=null,Q.value=nt()),Y.value=!0}async function ft(){let e={...Q.value},t;t=X.value&&Z.value?await ee(Z.value,e):await oe(e),t.error?window.$message?.error(t.error?.msg||`操作失败`):(window.$message?.success(X.value?`更新成功`:`创建成功`),Y.value=!1,$())}function pt(e){m.warning({title:`确认删除`,content:`确定要删除项目「${e.name}」吗？此操作不可恢复。`,positiveText:`确认删除`,negativeText:`取消`,onPositiveClick:async()=>{let{error:t}=await de(e.id);t?window.$message?.error(t?.msg||`操作失败`):(window.$message?.success(`删除成功`),$())}})}async function mt(e,t,n){let{error:r}=await re(e.id,{field:t,value:n});r?(e[t===`show_project`?`showProject`:`showHome`]=!n,window.$message?.error(r?.msg||`操作失败`)):e[t===`show_project`?`showProject`:`showHome`]=n}function ht(){L.value=1,$()}function gt(){x.value=``,w.value=`all`,E.value=`all`,D.value=`all`,L.value=1,$()}async function $(){F.value=!0;let{data:e,error:t}=await pe({name:x.value||void 0,category_id:w.value===`all`?void 0:w.value,status:E.value===`all`?void 0:E.value,guarantor_id:D.value===`all`?void 0:D.value,page:L.value,page_size:R.value});F.value=!1,t?window.$message?.error(t?.msg||`加载失败`):(K.value=e.list||[],B.value=e.total||0)}return a(L,$),e(()=>{N(),it(),$()}),(e,r)=>{let a=fe,d=h(`permission`);return i(),c(`div`,we,[s(`div`,Te,[r[40]||=s(`h2`,{class:`text-20px font-bold`},`项目列表`,-1),g((i(),_(b(P),{type:`primary`,onClick:r[0]||=e=>dt()},{default:f(()=>[...r[39]||=[t(`新增项目`,-1)]]),_:1})),[[d,`project.list.create`]])]),v(b(z),{bordered:!1,class:`card-wrapper mb-16px`},{default:f(()=>[v(b(he),null,{default:f(()=>[v(b(ge),{title:`筛选条件`,name:`filter`},{default:f(()=>[v(b(H),{"x-gap":16,"y-gap":12,cols:4},{default:f(()=>[v(b(V),null,{default:f(()=>[r[41]||=s(`div`,{class:`text-12px op-60 mb-4px`},`项目名称`,-1),v(b(I),{value:x.value,"onUpdate:value":r[1]||=e=>x.value=e,placeholder:`输入项目名称`,clearable:``,size:`small`,onKeyup:l(ht,[`enter`])},{suffix:f(()=>[v(a,{icon:`ph:magnifying-glass`,class:`op-40`})]),_:1},8,[`value`])]),_:1}),v(b(V),null,{default:f(()=>[r[42]||=s(`div`,{class:`text-12px op-60 mb-4px`},`项目分类`,-1),v(b(j),{value:w.value,"onUpdate:value":r[2]||=e=>w.value=e,options:O.value,size:`small`},null,8,[`value`,`options`])]),_:1}),v(b(V),null,{default:f(()=>[r[43]||=s(`div`,{class:`text-12px op-60 mb-4px`},`项目状态`,-1),v(b(j),{value:E.value,"onUpdate:value":r[3]||=e=>E.value=e,options:k,size:`small`},null,8,[`value`])]),_:1}),v(b(V),null,{default:f(()=>[r[44]||=s(`div`,{class:`text-12px op-60 mb-4px`},`担保机构`,-1),v(b(j),{value:D.value,"onUpdate:value":r[4]||=e=>D.value=e,options:A.value,size:`small`},null,8,[`value`,`options`])]),_:1})]),_:1}),s(`div`,Ee,[v(b(P),{size:`small`,onClick:gt},{default:f(()=>[...r[45]||=[t(`重置`,-1)]]),_:1}),v(b(P),{size:`small`,type:`primary`,onClick:ht},{default:f(()=>[...r[46]||=[t(`查询`,-1)]]),_:1})])]),_:1})]),_:1})]),_:1}),s(`div`,De,[(i(!0),c(u,null,o(K.value,e=>(i(),_(b(z),{key:e.id,bordered:!1,class:`card-wrapper`,"content-style":`padding: 16px 20px;`},{default:f(()=>[s(`div`,Oe,[s(`div`,ke,[r[47]||=s(`div`,{class:`text-11px op-50`},`编号`,-1),s(`div`,Ae,n(e.id),1),r[48]||=s(`div`,{class:`text-11px op-50 mt-6px`},`排序`,-1),s(`div`,je,n(e.sort),1)]),s(`div`,Me,[v(b(ce),{bordered:!1,size:`small`,type:`info`},{default:f(()=>[t(n(e.category?.name||`-`),1)]),_:2},1024),s(`div`,Ne,n(e.name),1),s(`div`,Pe,n(e.guarantor?.name||`-`),1)]),s(`div`,Fe,[r[49]||=s(`div`,{class:`text-11px op-50`},`规模(万)`,-1),s(`div`,Ie,n(e.scale?e.scale/1e4:`-`),1)]),s(`div`,Le,[r[50]||=s(`div`,{class:`text-11px op-50`},`进度`,-1),s(`div`,Re,[v(b(Ce),{percentage:e.progress||0,"show-indicator":!1,height:6,style:{width:`40px`}},null,8,[`percentage`]),s(`span`,ze,n(e.progress??0)+`%`,1)])]),s(`div`,Be,[r[51]||=s(`div`,{class:`text-11px op-50`},`交易收益`,-1),s(`div`,Ve,n(e.profitRate??`-`)+`%`,1)]),s(`div`,He,[r[52]||=s(`div`,{class:`text-11px op-50`},`起投金额(万)`,-1),s(`div`,Ue,n(e.minAmount?e.minAmount/1e4:`-`),1)]),s(`div`,We,[r[53]||=s(`div`,{class:`text-11px op-50`},`状态`,-1),v(b(ce),{type:Se(e.status),size:`small`,bordered:!1,class:`mt-2px`},{default:f(()=>[t(n(xe(e.status)),1)]),_:2},1032,[`type`])]),s(`div`,Ge,[r[54]||=s(`div`,{class:`text-11px op-50`},`期限`,-1),s(`div`,Ke,n(J(e)),1)]),g((i(),c(`div`,qe,[s(`div`,Je,[v(b(ue),{value:e.showProject,size:`small`,"onUpdate:value":t=>mt(e,`show_project`,t)},null,8,[`value`,`onUpdate:value`]),r[55]||=s(`span`,{class:`text-11px op-60`},`项目`,-1)]),s(`div`,Ye,[v(b(ue),{value:e.showHome,size:`small`,"onUpdate:value":t=>mt(e,`show_home`,t)},null,8,[`value`,`onUpdate:value`]),r[56]||=s(`span`,{class:`text-11px op-60`},`首页`,-1)])])),[[d,`project.list.toggle`]]),s(`div`,Xe,[s(`span`,Ze,n((e.publishedAt||e.createdAt||``).substring(0,10)||`-`),1),v(b(G),{size:4},{default:f(()=>[g((i(),_(b(P),{size:`tiny`,type:`primary`,quaternary:``,onClick:t=>dt(e)},{default:f(()=>[v(a,{icon:`ph:pencil-simple`})]),_:1},8,[`onClick`])),[[d,`project.list.edit`]]),g((i(),_(b(P),{size:`tiny`,type:`error`,quaternary:``,onClick:t=>pt(e)},{default:f(()=>[v(a,{icon:`ph:trash`})]),_:1},8,[`onClick`])),[[d,`project.list.delete`]])]),_:2},1024)])])]),_:2},1024))),128))]),!F.value&&K.value.length===0?(i(),c(`div`,Qe,` 暂无项目数据 `)):y(``,!0),s(`div`,$e,[s(`span`,et,`显示 1 到 `+n(K.value.length)+` 项，共 `+n(B.value)+` 项`,1),v(b(me),{page:L.value,"onUpdate:page":r[5]||=e=>L.value=e,"page-count":Math.ceil(B.value/R.value)||1},null,8,[`page`,`page-count`])]),v(b(ie),{show:Y.value,"onUpdate:show":r[38]||=e=>Y.value=e,width:680,placement:`right`},{default:f(()=>[v(b(ne),{title:X.value?`编辑项目`:`新增项目`,closable:``},{footer:f(()=>[v(b(G),{justify:`end`},{default:f(()=>[v(b(P),{onClick:r[37]||=e=>Y.value=!1},{default:f(()=>[...r[63]||=[t(`取消`,-1)]]),_:1}),v(b(P),{type:`primary`,onClick:ft},{default:f(()=>[...r[64]||=[t(`保存`,-1)]]),_:1})]),_:1})]),default:f(()=>[v(b(ae),{"label-placement":`top`,"label-width":`auto`,size:`small`},{default:f(()=>[v(b(H),{"x-gap":16,"y-gap":0,cols:2},{default:f(()=>[v(b(V),null,{default:f(()=>[v(b(C),{label:`分类选择`},{default:f(()=>[v(b(j),{value:Q.value.categoryId,"onUpdate:value":r[6]||=e=>Q.value.categoryId=e,options:le.value,placeholder:`选择分类`},null,8,[`value`,`options`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`起投金额（万）`},{default:f(()=>[v(b(T),{value:Q.value.minAmount,"onUpdate:value":r[7]||=e=>Q.value.minAmount=e,placeholder:`请输入起投金额`,class:`w-full`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`排序设置`},{default:f(()=>[v(b(T),{value:Q.value.sort,"onUpdate:value":r[8]||=e=>Q.value.sort=e,placeholder:``,class:`w-full`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`最高金额（万）`},{default:f(()=>[v(b(T),{value:Q.value.maxAmount,"onUpdate:value":r[9]||=e=>Q.value.maxAmount=e,placeholder:`留空表示无限制`,class:`w-full`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`会员等级`},{default:f(()=>[v(b(j),{value:Q.value.minLevelId,"onUpdate:value":r[10]||=e=>Q.value.minLevelId=e,options:rt.value,placeholder:`选择会员等级`},null,8,[`value`,`options`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`投资人数`},{default:f(()=>[v(b(T),{value:Q.value.investorCount,"onUpdate:value":r[11]||=e=>Q.value.investorCount=e,placeholder:`请输入投资人数`,class:`w-full`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`项目名称`},{default:f(()=>[v(b(I),{value:Q.value.name,"onUpdate:value":r[12]||=e=>Q.value.name=e,placeholder:`请输入项目名称`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`还款方式`},{default:f(()=>[v(b(j),{value:Q.value.returnMethod,"onUpdate:value":r[13]||=e=>Q.value.returnMethod=e,options:st},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`项目副标题`},{default:f(()=>[v(b(I),{value:Q.value.subtitle,"onUpdate:value":r[14]||=e=>Q.value.subtitle=e,placeholder:`请输入项目副标题`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`是否可以重复投资`},{default:f(()=>[v(b(W),{value:Q.value.canRepeatInvest,"onUpdate:value":r[15]||=e=>Q.value.canRepeatInvest=e},{default:f(()=>[v(b(U),{value:!1},{default:f(()=>[...r[57]||=[t(`不可以`,-1)]]),_:1}),v(b(U),{value:!0},{default:f(()=>[...r[58]||=[t(`可以`,-1)]]),_:1})]),_:1},8,[`value`])]),_:1}),Q.value.canRepeatInvest?(i(),_(b(C),{key:0,label:`重复投资次数`},{default:f(()=>[v(b(T),{value:Q.value.repeatInvestTimes,"onUpdate:value":r[16]||=e=>Q.value.repeatInvestTimes=e,placeholder:`请输入重复投资次数`,class:`w-full`},null,8,[`value`])]),_:1})):y(``,!0)]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`担保机构`},{default:f(()=>[v(b(j),{value:Q.value.guarantorId,"onUpdate:value":r[17]||=e=>Q.value.guarantorId=e,options:M.value,placeholder:`选择担保机构`},null,8,[`value`,`options`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`项目规模（万）`},{default:f(()=>[v(b(T),{value:Q.value.scale,"onUpdate:value":r[18]||=e=>Q.value.scale=e,placeholder:`请输入项目规模`,class:`w-full`},null,8,[`value`])]),_:1})]),_:1})]),_:1}),v(b(H),{"x-gap":16,"y-gap":0,cols:2},{default:f(()=>[v(b(V),null,{default:f(()=>[v(b(C),{label:`交易收益(%)`},{default:f(()=>[v(b(T),{value:Q.value.profitRate,"onUpdate:value":r[19]||=e=>Q.value.profitRate=e,placeholder:`请输入交易收益`,class:`w-full`},null,8,[`value`])]),_:1})]),_:1})]),_:1}),v(b(C),{label:`可投金额提示`},{default:f(()=>[v(b(I),{value:Q.value.amountTip,"onUpdate:value":r[20]||=e=>Q.value.amountTip=e,placeholder:`例如：投资期间只要产品未设置，投资者均可自由投资。`},null,8,[`value`])]),_:1}),v(b(C),{label:`投资进度(%)`},{default:f(()=>[v(b(T),{value:Q.value.progress,"onUpdate:value":r[21]||=e=>Q.value.progress=e,placeholder:`请输入投资进度(支持两位小数)`,class:`w-full`},null,8,[`value`])]),_:1}),v(b(C),{label:`自动进度增长`},{default:f(()=>[v(b(W),{value:Q.value.autoProgress,"onUpdate:value":r[22]||=e=>Q.value.autoProgress=e},{default:f(()=>[v(b(U),{value:!1},{default:f(()=>[...r[59]||=[t(`关闭`,-1)]]),_:1}),v(b(U),{value:!0},{default:f(()=>[...r[60]||=[t(`开启`,-1)]]),_:1})]),_:1},8,[`value`])]),_:1}),v(b(C),{label:`收益资金倍数`},{default:f(()=>[v(b(T),{value:Q.value.returnMultiple,"onUpdate:value":r[23]||=e=>Q.value.returnMultiple=e,placeholder:`请输入资金倍数`,class:`w-full`},null,8,[`value`])]),_:1}),v(b(C),{label:`项目期限`},{default:f(()=>[s(`div`,tt,[v(b(T),{value:Q.value.periodValue,"onUpdate:value":r[24]||=e=>Q.value.periodValue=e,placeholder:`期限`,class:`w-100px`},null,8,[`value`]),v(b(j),{value:Q.value.periodUnit,"onUpdate:value":r[25]||=e=>Q.value.periodUnit=e,options:at,class:`flex-1`},null,8,[`value`])])]),_:1}),v(b(C),{label:`项目返润`},{default:f(()=>[v(b(W),{value:Q.value.projectReturn,"onUpdate:value":r[26]||=e=>Q.value.projectReturn=e},{default:f(()=>[v(b(U),{value:!1},{default:f(()=>[...r[61]||=[t(`关闭`,-1)]]),_:1}),v(b(U),{value:!0},{default:f(()=>[...r[62]||=[t(`开启`,-1)]]),_:1})]),_:1},8,[`value`])]),_:1}),v(b(H),{"x-gap":16,cols:2},{default:f(()=>[v(b(V),null,{default:f(()=>[v(b(C),{label:`下线投资分成`},{default:f(()=>[v(b(j),{value:Q.value.subInvestType,"onUpdate:value":r[27]||=e=>Q.value.subInvestType=e,options:ct},null,8,[`value`])]),_:1})]),_:1}),v(b(V))]),_:1}),Q.value.subInvestType===`custom`?(i(),_(b(H),{key:0,"x-gap":16,cols:3},{default:f(()=>[v(b(V),null,{default:f(()=>[v(b(C),{label:`一级会员提成(%)`},{default:f(()=>[v(b(T),{value:Q.value.level1Rate,"onUpdate:value":r[28]||=e=>Q.value.level1Rate=e,placeholder:``,class:`w-full`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`二级会员提成(%)`},{default:f(()=>[v(b(T),{value:Q.value.level2Rate,"onUpdate:value":r[29]||=e=>Q.value.level2Rate=e,placeholder:``,class:`w-full`},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`三级会员提成(%)`},{default:f(()=>[v(b(T),{value:Q.value.level3Rate,"onUpdate:value":r[30]||=e=>Q.value.level3Rate=e,placeholder:``,class:`w-full`},null,8,[`value`])]),_:1})]),_:1})]),_:1})):y(``,!0),v(b(C),{label:`投资状态`},{default:f(()=>[v(b(j),{value:Q.value.status,"onUpdate:value":r[31]||=e=>Q.value.status=e,options:ot},null,8,[`value`])]),_:1}),v(b(C),{label:`发布时间`},{default:f(()=>[v(b(_e),{value:Q.value.publishedAt,"onUpdate:value":r[32]||=e=>Q.value.publishedAt=e,type:`date`,class:`w-full`},null,8,[`value`])]),_:1}),v(b(C),{label:`产品图片`},{default:f(()=>[v(ye,{modelValue:Q.value.image,"onUpdate:modelValue":r[33]||=e=>Q.value.image=e},null,8,[`modelValue`])]),_:1}),v(b(H),{"x-gap":16,cols:2},{default:f(()=>[v(b(V),null,{default:f(()=>[v(b(C),{label:`优惠券类型`},{default:f(()=>[v(b(j),{value:Q.value.couponType,"onUpdate:value":r[34]||=e=>Q.value.couponType=e,options:lt},null,8,[`value`])]),_:1})]),_:1}),v(b(V),null,{default:f(()=>[v(b(C),{label:`加息券类型`},{default:f(()=>[v(b(j),{value:Q.value.interestType,"onUpdate:value":r[35]||=e=>Q.value.interestType=e,options:ut},null,8,[`value`])]),_:1})]),_:1})]),_:1}),v(b(C),{label:`产品说明`},{default:f(()=>[v(b(I),{value:Q.value.description,"onUpdate:value":r[36]||=e=>Q.value.description=e,type:`textarea`,rows:6,placeholder:`请输入产品说明`},null,8,[`value`])]),_:1})]),_:1})]),_:1},8,[`title`])]),_:1},8,[`show`])])}}});export{Z as default};