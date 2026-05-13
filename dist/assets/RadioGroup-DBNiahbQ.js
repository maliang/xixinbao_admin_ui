import{E as e,U as t,dt as n,g as r,gt as i,j as a,k as o}from"./vue.runtime.esm-bundler-CNzWOCQx.js";import{Ba as s,Ea as c,Fo as l,Io as u,Mo as d,No as f,Po as p,Ra as m,Ta as h,ca as g,co as _,da as v,io as y,ja as b,jo as x,po as S,wa as C}from"./router-D14bnegb.js";import{t as w}from"./get-slot-DyvCJGRO.js";import{t as T}from"./light-Ce9ec8d1.js";var E=d(`radio`,`
 line-height: var(--n-label-line-height);
 outline: none;
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 align-items: flex-start;
 flex-wrap: nowrap;
 font-size: var(--n-font-size);
 word-break: break-word;
`,[p(`checked`,[f(`dot`,`
 background-color: var(--n-color-active);
 `)]),f(`dot-wrapper`,`
 position: relative;
 flex-shrink: 0;
 flex-grow: 0;
 width: var(--n-radio-size);
 `),d(`radio-input`,`
 position: absolute;
 border: 0;
 width: 0;
 height: 0;
 opacity: 0;
 margin: 0;
 `),f(`dot`,`
 position: absolute;
 top: 50%;
 left: 0;
 transform: translateY(-50%);
 height: var(--n-radio-size);
 width: var(--n-radio-size);
 background: var(--n-color);
 box-shadow: var(--n-box-shadow);
 border-radius: 50%;
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `,[x(`&::before`,`
 content: "";
 opacity: 0;
 position: absolute;
 left: 4px;
 top: 4px;
 height: calc(100% - 8px);
 width: calc(100% - 8px);
 border-radius: 50%;
 transform: scale(.8);
 background: var(--n-dot-color-active);
 transition: 
 opacity .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 transform .3s var(--n-bezier);
 `),p(`checked`,{boxShadow:`var(--n-box-shadow-active)`},[x(`&::before`,`
 opacity: 1;
 transform: scale(1);
 `)])]),f(`label`,`
 color: var(--n-text-color);
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 display: inline-block;
 transition: color .3s var(--n-bezier);
 `),l(`disabled`,`
 cursor: pointer;
 `,[x(`&:hover`,[f(`dot`,{boxShadow:`var(--n-box-shadow-hover)`})]),p(`focus`,[x(`&:not(:active)`,[f(`dot`,{boxShadow:`var(--n-box-shadow-focus)`})])])]),p(`disabled`,`
 cursor: not-allowed;
 `,[f(`dot`,{boxShadow:`var(--n-box-shadow-disabled)`,backgroundColor:`var(--n-color-disabled)`},[x(`&::before`,{backgroundColor:`var(--n-dot-color-disabled)`}),p(`checked`,`
 opacity: 1;
 `)]),f(`label`,{color:`var(--n-text-color-disabled)`}),d(`radio-input`,`
 cursor: not-allowed;
 `)])]),D={name:String,value:{type:[String,Number,Boolean],default:`on`},checked:{type:Boolean,default:void 0},defaultChecked:Boolean,disabled:{type:Boolean,default:void 0},label:String,size:String,onUpdateChecked:[Function,Array],"onUpdate:checked":[Function,Array],checkedValue:{type:Boolean,default:void 0}},O=y(`n-radio-group`);function k(e){let t=a(O,null),{mergedClsPrefixRef:r,mergedComponentPropsRef:o}=c(e),l=C(e,{mergedSize(n){let{size:r}=e;if(r!==void 0)return r;if(t){let{mergedSizeRef:{value:e}}=t;if(e!==void 0)return e}return n?n.mergedSize.value:o?.value?.Radio?.size||`medium`},mergedDisabled(n){return!!(e.disabled||t?.disabledRef.value||n?.disabled.value)}}),{mergedSizeRef:u,mergedDisabledRef:d}=l,f=n(null),p=n(null),m=n(e.defaultChecked),h=_(i(e,`checked`),m),g=S(()=>t?t.valueRef.value===e.value:h.value),v=S(()=>{let{name:n}=e;if(n!==void 0)return n;if(t)return t.nameRef.value}),y=n(!1);function b(){if(t){let{doUpdateValue:n}=t,{value:r}=e;s(n,r)}else{let{onUpdateChecked:t,"onUpdate:checked":n}=e,{nTriggerFormInput:r,nTriggerFormChange:i}=l;t&&s(t,!0),n&&s(n,!0),r(),i(),m.value=!0}}function x(){d.value||g.value||b()}function w(){x(),f.value&&(f.value.checked=g.value)}function T(){y.value=!1}function E(){y.value=!0}return{mergedClsPrefix:t?t.mergedClsPrefixRef:r,inputRef:f,labelRef:p,mergedName:v,mergedDisabled:d,renderSafeChecked:g,focus:y,mergedSize:u,handleRadioInputChange:w,handleRadioInputBlur:T,handleRadioInputFocus:E}}var A=e({name:`Radio`,props:Object.assign(Object.assign({},g.props),D),setup(e){let t=k(e),n=g(`Radio`,`-radio`,E,T,e,t.mergedClsPrefix),i=r(()=>{let{mergedSize:{value:e}}=t,{common:{cubicBezierEaseInOut:r},self:{boxShadow:i,boxShadowActive:a,boxShadowDisabled:o,boxShadowFocus:s,boxShadowHover:c,color:l,colorDisabled:d,colorActive:f,textColor:p,textColorDisabled:m,dotColorActive:h,dotColorDisabled:g,labelPadding:_,labelLineHeight:v,labelFontWeight:y,[u(`fontSize`,e)]:b,[u(`radioSize`,e)]:x}}=n.value;return{"--n-bezier":r,"--n-label-line-height":v,"--n-label-font-weight":y,"--n-box-shadow":i,"--n-box-shadow-active":a,"--n-box-shadow-disabled":o,"--n-box-shadow-focus":s,"--n-box-shadow-hover":c,"--n-color":l,"--n-color-active":f,"--n-color-disabled":d,"--n-dot-color-active":h,"--n-dot-color-disabled":g,"--n-font-size":b,"--n-radio-size":x,"--n-text-color":p,"--n-text-color-disabled":m,"--n-label-padding":_}}),{inlineThemeDisabled:a,mergedClsPrefixRef:o,mergedRtlRef:s}=c(e),l=v(`Radio`,s,o),d=a?h(`radio`,r(()=>t.mergedSize.value[0]),i,e):void 0;return Object.assign(t,{rtlEnabled:l,cssVars:a?void 0:i,themeClass:d?.themeClass,onRender:d?.onRender})},render(){let{$slots:e,mergedClsPrefix:t,onRender:n,label:r}=this;return n?.(),o(`label`,{class:[`${t}-radio`,this.themeClass,this.rtlEnabled&&`${t}-radio--rtl`,this.mergedDisabled&&`${t}-radio--disabled`,this.renderSafeChecked&&`${t}-radio--checked`,this.focus&&`${t}-radio--focus`],style:this.cssVars},o(`div`,{class:`${t}-radio__dot-wrapper`},`\xA0`,o(`div`,{class:[`${t}-radio__dot`,this.renderSafeChecked&&`${t}-radio__dot--checked`]}),o(`input`,{ref:`inputRef`,type:`radio`,class:`${t}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur})),b(e.default,e=>!e&&!r?null:o(`div`,{ref:`labelRef`,class:`${t}-radio__label`},e||r)))}}),j=d(`radio-group`,`
 display: inline-block;
 font-size: var(--n-font-size);
`,[f(`splitor`,`
 display: inline-block;
 vertical-align: bottom;
 width: 1px;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 background: var(--n-button-border-color);
 `,[p(`checked`,{backgroundColor:`var(--n-button-border-color-active)`}),p(`disabled`,{opacity:`var(--n-opacity-disabled)`})]),p(`button-group`,`
 white-space: nowrap;
 height: var(--n-height);
 line-height: var(--n-height);
 `,[d(`radio-button`,{height:`var(--n-height)`,lineHeight:`var(--n-height)`}),f(`splitor`,{height:`var(--n-height)`})]),d(`radio-button`,`
 vertical-align: bottom;
 outline: none;
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 display: inline-block;
 box-sizing: border-box;
 padding-left: 14px;
 padding-right: 14px;
 white-space: nowrap;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 background: var(--n-button-color);
 color: var(--n-button-text-color);
 border-top: 1px solid var(--n-button-border-color);
 border-bottom: 1px solid var(--n-button-border-color);
 `,[d(`radio-input`,`
 pointer-events: none;
 position: absolute;
 border: 0;
 border-radius: inherit;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 opacity: 0;
 z-index: 1;
 `),f(`state-border`,`
 z-index: 1;
 pointer-events: none;
 position: absolute;
 box-shadow: var(--n-button-box-shadow);
 transition: box-shadow .3s var(--n-bezier);
 left: -1px;
 bottom: -1px;
 right: -1px;
 top: -1px;
 `),x(`&:first-child`,`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 border-left: 1px solid var(--n-button-border-color);
 `,[f(`state-border`,`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 `)]),x(`&:last-child`,`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 border-right: 1px solid var(--n-button-border-color);
 `,[f(`state-border`,`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 `)]),l(`disabled`,`
 cursor: pointer;
 `,[x(`&:hover`,[f(`state-border`,`
 transition: box-shadow .3s var(--n-bezier);
 box-shadow: var(--n-button-box-shadow-hover);
 `),l(`checked`,{color:`var(--n-button-text-color-hover)`})]),p(`focus`,[x(`&:not(:active)`,[f(`state-border`,{boxShadow:`var(--n-button-box-shadow-focus)`})])])]),p(`checked`,`
 background: var(--n-button-color-active);
 color: var(--n-button-text-color-active);
 border-color: var(--n-button-border-color-active);
 `),p(`disabled`,`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `)])]);function M(e,t,n){let r=[],i=!1;for(let a=0;a<e.length;++a){let s=e[a],c=s.type?.name;c===`RadioButton`&&(i=!0);let l=s.props;if(c!==`RadioButton`){r.push(s);continue}if(a===0)r.push(s);else{let e=r[r.length-1].props,i=t===e.value,a=e.disabled,c=t===l.value,u=l.disabled,d=(i?2:0)+ +!a,f=(c?2:0)+ +!u,p={[`${n}-radio-group__splitor--disabled`]:a,[`${n}-radio-group__splitor--checked`]:i},m={[`${n}-radio-group__splitor--disabled`]:u,[`${n}-radio-group__splitor--checked`]:c},h=d<f?m:p;r.push(o(`div`,{class:[`${n}-radio-group__splitor`,h]}),s)}}return{children:r,isButtonGroup:i}}var N=e({name:`RadioGroup`,props:Object.assign(Object.assign({},g.props),{name:String,value:[String,Number,Boolean],defaultValue:{type:[String,Number,Boolean],default:null},size:String,disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),setup(e){let a=n(null),{mergedSizeRef:o,mergedDisabledRef:l,nTriggerFormChange:d,nTriggerFormInput:f,nTriggerFormBlur:p,nTriggerFormFocus:m}=C(e),{mergedClsPrefixRef:y,inlineThemeDisabled:b,mergedRtlRef:x}=c(e),S=g(`Radio`,`-radio-group`,j,T,e,y),w=n(e.defaultValue),E=_(i(e,`value`),w);function D(t){let{onUpdateValue:n,"onUpdate:value":r}=e;n&&s(n,t),r&&s(r,t),w.value=t,d(),f()}function k(e){let{value:t}=a;t&&(t.contains(e.relatedTarget)||m())}function A(e){let{value:t}=a;t&&(t.contains(e.relatedTarget)||p())}t(O,{mergedClsPrefixRef:y,nameRef:i(e,`name`),valueRef:E,disabledRef:l,mergedSizeRef:o,doUpdateValue:D});let M=v(`Radio`,x,y),N=r(()=>{let{value:e}=o,{common:{cubicBezierEaseInOut:t},self:{buttonBorderColor:n,buttonBorderColorActive:r,buttonBorderRadius:i,buttonBoxShadow:a,buttonBoxShadowFocus:s,buttonBoxShadowHover:c,buttonColor:l,buttonColorActive:d,buttonTextColor:f,buttonTextColorActive:p,buttonTextColorHover:m,opacityDisabled:h,[u(`buttonHeight`,e)]:g,[u(`fontSize`,e)]:_}}=S.value;return{"--n-font-size":_,"--n-bezier":t,"--n-button-border-color":n,"--n-button-border-color-active":r,"--n-button-border-radius":i,"--n-button-box-shadow":a,"--n-button-box-shadow-focus":s,"--n-button-box-shadow-hover":c,"--n-button-color":l,"--n-button-color-active":d,"--n-button-text-color":f,"--n-button-text-color-hover":m,"--n-button-text-color-active":p,"--n-height":g,"--n-opacity-disabled":h}}),P=b?h(`radio-group`,r(()=>o.value[0]),N,e):void 0;return{selfElRef:a,rtlEnabled:M,mergedClsPrefix:y,mergedValue:E,handleFocusout:A,handleFocusin:k,cssVars:b?void 0:N,themeClass:P?.themeClass,onRender:P?.onRender}},render(){var e;let{mergedValue:t,mergedClsPrefix:n,handleFocusin:r,handleFocusout:i}=this,{children:a,isButtonGroup:s}=M(m(w(this)),t,n);return(e=this.onRender)==null||e.call(this),o(`div`,{onFocusin:r,onFocusout:i,ref:`selfElRef`,class:[`${n}-radio-group`,this.rtlEnabled&&`${n}-radio-group--rtl`,this.themeClass,s&&`${n}-radio-group--button-group`],style:this.cssVars},a)}});export{A as n,N as t};