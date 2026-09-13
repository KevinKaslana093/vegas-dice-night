// Shared casino marks: decorative only; they never encode gameplay state.
export function chipMark(label='V',extra=''){
 const safe=String(label).replace(/[<>&"']/g,'');
 return `<svg class="chip-mark ${extra}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="chip-body" cx="60" cy="60" r="56"/><circle class="chip-rim" cx="60" cy="60" r="49"/><circle class="chip-inner" cx="60" cy="60" r="36"/><circle class="chip-hairline" cx="60" cy="60" r="32"/><text x="60" y="62" text-anchor="middle" dominant-baseline="middle">${safe}</text></svg>`;
}
export function pipMark(value=5,extra=''){
 const spots={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
 return `<span class="pip-mark ${extra}" aria-hidden="true">${Array.from({length:9},(_,i)=>`<i class="${spots[value]?.includes(i)?'on':''}"></i>`).join('')}</span>`;
}
export function suitMark(index=0,extra=''){return `<span class="suit-mark suit-${index%4} ${extra}" aria-hidden="true">${['♠','♥','♣','♦'][index%4]}</span>`;}
