const f=async()=>{
  const OR_KEY='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'; 
  const OR_URL='https://openrouter.ai/api/v1/chat/completions'; 
  const r = await fetch(OR_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+OR_KEY},
    body:JSON.stringify({
      model:'google/gemma-4-31b-it:free',
      messages:[
        {role:'system',content:'Precise nutritionist. Return nutrition for the EXACT quantity stated. ONLY valid JSON, no markdown. Schema: {"name":"string","calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"sodium":number,"potassium":number,"calcium":number,"iron":number,"vitaminA":number,"vitaminB12":number,"vitaminC":number,"vitaminD":number,"vitaminE":number,"magnesium":number,"zinc":number}'},
        {role:'user',content:'Food: "2 apples"'}
      ]
    })
  }); 
  const data = await r.json();
  console.log(JSON.stringify(data, null, 2)); 
}; 
f();
