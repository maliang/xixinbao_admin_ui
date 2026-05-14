import{E as e,U as t,dt as n,g as r,gt as i,j as a,k as o,s,tt as c}from"./vue.runtime.esm-bundler-CNzWOCQx.js";import{$a as l,Ca as u,Eo as d,Go as f,Ha as p,Ko as m,La as h,Qa as g,Ra as _,To as v,Uo as y,Vo as b,Wa as x,Wo as S,ba as C,bo as w,go as T,ko as E,oa as D,pa as O,qo as k,va as A}from"./router-Bw4cPsv5.js";import{t as j}from"./fade-in-height-expand.cssr-CfAxCeo_.js";import{t as M}from"./light-uUK3Jp2P.js";var N=e({name:`ChevronLeft`,render(){return o(`svg`,{viewBox:`0 0 16 16`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`},o(`path`,{d:`M10.3536 3.14645C10.5488 3.34171 10.5488 3.65829 10.3536 3.85355L6.20711 8L10.3536 12.1464C10.5488 12.3417 10.5488 12.6583 10.3536 12.8536C10.1583 13.0488 9.84171 13.0488 9.64645 12.8536L5.14645 8.35355C4.95118 8.15829 4.95118 7.84171 5.14645 7.64645L9.64645 3.14645C9.84171 2.95118 10.1583 2.95118 10.3536 3.14645Z`,fill:`currentColor`}))}}),P=S(`collapse`,`width: 100%;`,[S(`collapse-item`,`
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 margin: var(--n-item-margin);
 `,[m(`disabled`,[f(`header`,`cursor: not-allowed;`,[f(`header-main`,`
 color: var(--n-title-text-color-disabled);
 `),S(`collapse-item-arrow`,`
 color: var(--n-arrow-color-disabled);
 `)])]),S(`collapse-item`,`margin-left: 32px;`),y(`&:first-child`,`margin-top: 0;`),y(`&:first-child >`,[f(`header`,`padding-top: 0;`)]),m(`left-arrow-placement`,[f(`header`,[S(`collapse-item-arrow`,`margin-right: 4px;`)])]),m(`right-arrow-placement`,[f(`header`,[S(`collapse-item-arrow`,`margin-left: 4px;`)])]),f(`content-wrapper`,[f(`content-inner`,`padding-top: 16px;`),j({duration:`0.15s`})]),m(`active`,[f(`header`,[m(`active`,[S(`collapse-item-arrow`,`transform: rotate(90deg);`)])])]),y(`&:not(:first-child)`,`border-top: 1px solid var(--n-divider-color);`),k(`disabled`,[m(`trigger-area-main`,[f(`header`,[f(`header-main`,`cursor: pointer;`),S(`collapse-item-arrow`,`cursor: default;`)])]),m(`trigger-area-arrow`,[f(`header`,[S(`collapse-item-arrow`,`cursor: pointer;`)])]),m(`trigger-area-extra`,[f(`header`,[f(`header-extra`,`cursor: pointer;`)])])]),f(`header`,`
 font-size: var(--n-title-font-size);
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition: color .3s var(--n-bezier);
 position: relative;
 padding: var(--n-title-padding);
 color: var(--n-title-text-color);
 `,[f(`header-main`,`
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 color: var(--n-title-text-color);
 `),f(`header-extra`,`
 display: flex;
 align-items: center;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),S(`collapse-item-arrow`,`
 display: flex;
 transition:
 transform .15s var(--n-bezier),
 color .3s var(--n-bezier);
 font-size: 18px;
 color: var(--n-arrow-color);
 `)])])]),F=Object.assign(Object.assign({},C.props),{defaultExpandedNames:{type:[Array,String],default:null},expandedNames:[Array,String],arrowPlacement:{type:String,default:`left`},accordion:{type:Boolean,default:!1},displayDirective:{type:String,default:`if`},triggerAreas:{type:Array,default:()=>[`main`,`extra`,`arrow`]},onItemHeaderClick:[Function,Array],"onUpdate:expandedNames":[Function,Array],onUpdateExpandedNames:[Function,Array],onExpandedNamesChange:{type:[Function,Array],validator:()=>!0,default:void 0}}),I=T(`n-collapse`),L=e({name:`Collapse`,props:F,slots:Object,setup(e,{slots:i}){let{mergedClsPrefixRef:a,inlineThemeDisabled:o,mergedRtlRef:s}=_(e),c=n(e.defaultExpandedNames),l=w(r(()=>e.expandedNames),c),d=C(`Collapse`,`-collapse`,P,M,e,a);function f(t){let{"onUpdate:expandedNames":n,onUpdateExpandedNames:r,onExpandedNamesChange:i}=e;r&&g(r,t),n&&g(n,t),i&&g(i,t),c.value=t}function p(t){let{onItemHeaderClick:n}=e;n&&g(n,t)}function m(t,n,r){let{accordion:i}=e,{value:a}=l;if(i)t?(f([n]),p({name:n,expanded:!0,event:r})):(f([]),p({name:n,expanded:!1,event:r}));else if(!Array.isArray(a))f([n]),p({name:n,expanded:!0,event:r});else{let e=a.slice(),t=e.findIndex(e=>n===e);~t?(e.splice(t,1),f(e),p({name:n,expanded:!1,event:r})):(e.push(n),f(e),p({name:n,expanded:!0,event:r}))}}t(I,{props:e,mergedClsPrefixRef:a,expandedNamesRef:l,slots:i,toggleItem:m});let v=u(`Collapse`,s,a),y=r(()=>{let{common:{cubicBezierEaseInOut:e},self:{titleFontWeight:t,dividerColor:n,titlePadding:r,titleTextColor:i,titleTextColorDisabled:a,textColor:o,arrowColor:s,fontSize:c,titleFontSize:l,arrowColorDisabled:u,itemMargin:f}}=d.value;return{"--n-font-size":c,"--n-bezier":e,"--n-text-color":o,"--n-divider-color":n,"--n-title-padding":r,"--n-title-font-size":l,"--n-title-text-color":i,"--n-title-text-color-disabled":a,"--n-title-font-weight":t,"--n-arrow-color":s,"--n-arrow-color-disabled":u,"--n-item-margin":f}}),b=o?h(`collapse`,void 0,y,e):void 0;return{rtlEnabled:v,mergedTheme:d,mergedClsPrefix:a,cssVars:o?void 0:y,themeClass:b?.themeClass,onRender:b?.onRender}},render(){var e;return(e=this.onRender)==null||e.call(this),o(`div`,{class:[`${this.mergedClsPrefix}-collapse`,this.rtlEnabled&&`${this.mergedClsPrefix}-collapse--rtl`,this.themeClass],style:this.cssVars},this.$slots)}}),R=e({name:`CollapseItemContent`,props:{displayDirective:{type:String,required:!0},show:Boolean,clsPrefix:{type:String,required:!0}},setup(e){return{onceTrue:d(i(e,`show`))}},render(){return o(D,null,{default:()=>{let{show:e,displayDirective:t,onceTrue:n,clsPrefix:r}=this,i=t===`show`&&n,a=o(`div`,{class:`${r}-collapse-item__content-wrapper`},o(`div`,{class:`${r}-collapse-item__content-inner`},this.$slots));return i?c(a,[[s,e]]):e?a:null}})}}),z=e({name:`CollapseItem`,props:{title:String,name:[String,Number],disabled:Boolean,displayDirective:String},setup(e){let{mergedRtlRef:t}=_(e),n=E(),o=v(()=>e.name??n),s=a(I);s||l(`collapse-item`,"`n-collapse-item` must be placed inside `n-collapse`.");let{expandedNamesRef:c,props:d,mergedClsPrefixRef:f,slots:p}=s,m=r(()=>{let{value:e}=c;if(Array.isArray(e)){let{value:t}=o;return!~e.findIndex(e=>e===t)}else if(e){let{value:t}=o;return t!==e}return!0});return{rtlEnabled:u(`Collapse`,t,f),collapseSlots:p,randomName:n,mergedClsPrefix:f,collapsed:m,triggerAreas:i(d,`triggerAreas`),mergedDisplayDirective:r(()=>{let{displayDirective:t}=e;return t||d.displayDirective}),arrowPlacement:r(()=>d.arrowPlacement),handleClick(t){let n=`main`;b(t,`arrow`)&&(n=`arrow`),b(t,`extra`)&&(n=`extra`),d.triggerAreas.includes(n)&&s&&!e.disabled&&s.toggleItem(m.value,o.value,t)}}},render(){let{collapseSlots:e,$slots:t,arrowPlacement:n,collapsed:r,mergedDisplayDirective:i,mergedClsPrefix:a,disabled:s,triggerAreas:c}=this,l=p(t.header,{collapsed:r},()=>[this.title]),u=t[`header-extra`]||e[`header-extra`],d=t.arrow||e.arrow;return o(`div`,{class:[`${a}-collapse-item`,`${a}-collapse-item--${n}-arrow-placement`,s&&`${a}-collapse-item--disabled`,!r&&`${a}-collapse-item--active`,c.map(e=>`${a}-collapse-item--trigger-area-${e}`)]},o(`div`,{class:[`${a}-collapse-item__header`,!r&&`${a}-collapse-item__header--active`]},o(`div`,{class:`${a}-collapse-item__header-main`,onClick:this.handleClick},n===`right`&&l,o(`div`,{class:`${a}-collapse-item-arrow`,key:+!this.rtlEnabled,"data-arrow":!0},p(d,{collapsed:r},()=>[o(A,{clsPrefix:a},{default:()=>this.rtlEnabled?o(N,null):o(O,null)})])),n===`left`&&l),x(u,{collapsed:r},e=>o(`div`,{class:`${a}-collapse-item__header-extra`,onClick:this.handleClick,"data-extra":!0},e))),o(R,{clsPrefix:a,displayDirective:i,show:!r},t))}});export{L as n,z as t};