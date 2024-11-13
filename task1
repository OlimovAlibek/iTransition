let a=process.argv.slice(2);
if(!a.length)return console.log("");
let s=a[0],r="";
for(let i=0;i<s.length;i++)for(let j=i+1;j<=s.length;j++){let t=s.slice(i,j);if(a.every(w=>w.includes(t))&&t.length>r.length)r=t}
console.log(r);
