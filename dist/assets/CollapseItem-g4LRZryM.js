import{E as e,U as t,dt as n,g as r,gt as i,j as a,k as o,s,tt as c}from"./vue.runtime.esm-bundler-CNzWOCQx.js";import{Bo as l,Co as u,Eo as d,Fa as f,Ho as p,Pa as m,Ro as h,So as g,Uo as _,Va as v,Vo as y,Wo as b,Xa as x,Ya as S,_a as C,_o as w,ba as T,da as E,ha as D,ia as O,po as k,za as A}from"./router-Bd8KHjhA.js";import{t as j}from"./fade-in-height-expand.cssr-C58j4GTj.js";import{t as M}from"./light-CHu2wvYg.js";var N=e({name:`ChevronLeft`,render(){return o(`svg`,{viewBox:`0 0 16 16`,fill:`none`,xmlns:`http://www.w3.org/2000/svg`},o(`path`,{d:`M10.3536 3.14645C10.5488 3.34171 10.5488 3.65829 10.3536 3.85355L6.20711 8L10.3536 12.1464C10.5488 12.3417 10.5488 12.6583 10.3536 12.8536C10.1583 13.0488 9.84171 13.0488 9.64645 12.8536L5.14645 8.35355C4.95118 8.15829 4.95118 7.84171 5.14645 7.64645L9.64645 3.14645C9.84171 2.95118 10.1583 2.95118 10.3536 3.14645Z`,fill:`currentColor`}))}}),P=y(`collapse`,`width: 100%;`,[y(`collapse-item`,`
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 margin: var(--n-item-margin);
 `,[_(`disabled`,[p(`header`,`cursor: not-allowed;`,[p(`header-main`,`
 color: var(--n-title-text-color-disabled);
 `),y(`collapse-item-arrow`,`
 color: var(--n-arrow-color-disabled);
 `)])]),y(`collapse-item`,`margin-left: 32px;`),l(`&:first-child`,`margin-top: 0;`),l(`&:first-child >`,[p(`header`,`padding-top: 0;`)]),_(`left-arrow-placement`,[p(`header`,[y(`collapse-item-arrow`,`margin-right: 4px;`)])]),_(`right-arrow-placement`,[p(`header`,[y(`collapse-item-arrow`,`margin-left: 4px;`)])]),p(`content-wrapper`,[p(`content-inner`,`padding-top: 16px;`),j({duration:`0.15s`})]),_(`active`,[p(`header`,[_(`active`,[y(`collapse-item-arrow`,`transform: rotate(90deg);`)])])]),l(`&:not(:first-child)`,`border-top: 1px solid var(--n-divider-color);`),b(`disabled`,[_(`trigger-area-main`,[p(`header`,[p(`header-main`,`cursor: pointer;`),y(`collapse-item-arrow`,`cursor: default;`)])]),_(`trigger-area-arrow`,[p(`header`,[y(`collapse-item-arrow`,`cursor: pointer;`)])]),_(`trigger-area-extra`,[p(`header`,[p(`header-extra`,`cursor: pointer;`)])])]),p(`header`,`
 font-size: var(--n-title-font-size);
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition: color .3s var(--n-bezier);
 position: relative;
 padding: var(--n-title-padding);
 color: var(--n-title-text-color);
 `,[p(`header-main`,`
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 color: var(--n-title-text-color);
 `),p(`header-extra`,`
 display: flex;
 align-items: center;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),y(`collapse-item-arrow`,`
 display: flex;
 transition:
 transform .15s var(--n-bezier),
 color .3s var(--n-bezier);
 font-size: 18px;
 color: var(--n-arrow-color);
 `)])])]),F=Object.assign(Object.assign({},C.props),{defaultExpandedNames:{type:[Array,String],default:null},expandedNames:[Array,String],arrowPlacement:{type:String,default:`left`},accordion:{type:Boolean,default:!1},displayDirective:{type:String,default:`if`},triggerAreas:{type:Array,default:()=>[`main`,`extra`,`arrow`]},onItemHeaderClick:[Function,Array],"onUpdate:expandedNames":[Function,Array],onUpdateExpandedNames:[Function,Array],onExpandedNamesChange:{type:[Function,Array],validator:()=>!0,default:void 0}}),I=k(`n-collapse`),L=e({name:`Collapse`,props:F,slots:Object,setup(e,{slots:i}){let{mergedClsPrefixRef:a,inlineThemeDisabled:o,mergedRtlRef:s}=f(e),c=n(e.defaultExpandedNames),l=w(r(()=>e.expandedNames),c),u=C(`Collapse`,`-collapse`,P,M,e,a);function d(t){let{"onUpdate:expandedNames":n,onUpdateExpandedNames:r,onExpandedNamesChange:i}=e;r&&S(r,t),n&&S(n,t),i&&S(i,t),c.value=t}function p(t){let{onItemHeaderClick:n}=e;n&&S(n,t)}function h(t,n,r){let{accordion:i}=e,{value:a}=l;if(i)t?(d([n]),p({name:n,expanded:!0,event:r})):(d([]),p({name:n,expanded:!1,event:r}));else if(!Array.isArray(a))d([n]),p({name:n,expanded:!0,event:r});else{let e=a.slice(),t=e.findIndex(e=>n===e);~t?(e.splice(t,1),d(e),p({name:n,expanded:!1,event:r})):(e.push(n),d(e),p({name:n,expanded:!0,event:r}))}}t(I,{props:e,mergedClsPrefixRef:a,expandedNamesRef:l,slots:i,toggleItem:h});let g=T(`Collapse`,s,a),_=r(()=>{let{common:{cubicBezierEaseInOut:e},self:{titleFontWeight:t,dividerColor:n,titlePadding:r,titleTextColor:i,titleTextColorDisabled:a,textColor:o,arrowColor:s,fontSize:c,titleFontSize:l,arrowColorDisabled:d,itemMargin:f}}=u.value;return{"--n-font-size":c,"--n-bezier":e,"--n-text-color":o,"--n-divider-color":n,"--n-title-padding":r,"--n-title-font-size":l,"--n-title-text-color":i,"--n-title-text-color-disabled":a,"--n-title-font-weight":t,"--n-arrow-color":s,"--n-arrow-color-disabled":d,"--n-item-margin":f}}),v=o?m(`collapse`,void 0,_,e):void 0;return{rtlEnabled:g,mergedTheme:u,mergedClsPrefix:a,cssVars:o?void 0:_,themeClass:v?.themeClass,onRender:v?.onRender}},render(){var e;return(e=this.onRender)==null||e.call(this),o(`div`,{class:[`${this.mergedClsPrefix}-collapse`,this.rtlEnabled&&`${this.mergedClsPrefix}-collapse--rtl`,this.themeClass],style:this.cssVars},this.$slots)}}),R=e({name:`CollapseItemContent`,props:{displayDirective:{type:String,required:!0},show:Boolean,clsPrefix:{type:String,required:!0}},setup(e){return{onceTrue:u(i(e,`show`))}},render(){return o(O,null,{default:()=>{let{show:e,displayDirective:t,onceTrue:n,clsPrefix:r}=this,i=t===`show`&&n,a=o(`div`,{class:`${r}-collapse-item__content-wrapper`},o(`div`,{class:`${r}-collapse-item__content-inner`},this.$slots));return i?c(a,[[s,e]]):e?a:null}})}}),z=e({name:`CollapseItem`,props:{title:String,name:[String,Number],disabled:Boolean,displayDirective:String},setup(e){let{mergedRtlRef:t}=f(e),n=d(),o=g(()=>e.name??n),s=a(I);s||x(`collapse-item`,"`n-collapse-item` must be placed inside `n-collapse`.");let{expandedNamesRef:c,props:l,mergedClsPrefixRef:u,slots:p}=s,m=r(()=>{let{value:e}=c;if(Array.isArray(e)){let{value:t}=o;return!~e.findIndex(e=>e===t)}else if(e){let{value:t}=o;return t!==e}return!0});return{rtlEnabled:T(`Collapse`,t,u),collapseSlots:p,randomName:n,mergedClsPrefix:u,collapsed:m,triggerAreas:i(l,`triggerAreas`),mergedDisplayDirective:r(()=>{let{displayDirective:t}=e;return t||l.displayDirective}),arrowPlacement:r(()=>l.arrowPlacement),handleClick(t){let n=`main`;h(t,`arrow`)&&(n=`arrow`),h(t,`extra`)&&(n=`extra`),l.triggerAreas.includes(n)&&s&&!e.disabled&&s.toggleItem(m.value,o.value,t)}}},render(){let{collapseSlots:e,$slots:t,arrowPlacement:n,collapsed:r,mergedDisplayDirective:i,mergedClsPrefix:a,disabled:s,triggerAreas:c}=this,l=A(t.header,{collapsed:r},()=>[this.title]),u=t[`header-extra`]||e[`header-extra`],d=t.arrow||e.arrow;return o(`div`,{class:[`${a}-collapse-item`,`${a}-collapse-item--${n}-arrow-placement`,s&&`${a}-collapse-item--disabled`,!r&&`${a}-collapse-item--active`,c.map(e=>`${a}-collapse-item--trigger-area-${e}`)]},o(`div`,{class:[`${a}-collapse-item__header`,!r&&`${a}-collapse-item__header--active`]},o(`div`,{class:`${a}-collapse-item__header-main`,onClick:this.handleClick},n===`right`&&l,o(`div`,{class:`${a}-collapse-item-arrow`,key:+!this.rtlEnabled,"data-arrow":!0},A(d,{collapsed:r},()=>[o(D,{clsPrefix:a},{default:()=>this.rtlEnabled?o(N,null):o(E,null)})])),n===`left`&&l),v(u,{collapsed:r},e=>o(`div`,{class:`${a}-collapse-item__header-extra`,onClick:this.handleClick,"data-extra":!0},e))),o(R,{clsPrefix:a,displayDirective:i,show:!r},t))}});export{L as n,z as t};