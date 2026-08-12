let ws, me=0, roomId="", used=[];
const $=id=>document.getElementById(id);
function connect(){ ws=new WebSocket((location.protocol==="https:"?"wss://":"ws://")+location.host);
  ws.onopen=()=>{$("status").textContent="サーバー接続OK";};
  ws.onclose=()=>{$("status").textContent="サーバーから切断されました";};
  ws.onmessage=e=>handle(JSON.parse(e.data));
}
function send(x){if(ws?.readyState===1)ws.send(JSON.stringify(x))}
function name(){return $("name").value.trim()||"PLAYER"}
$("create").onclick=()=>{send({type:"create",name:name()})};
$("join").onclick=()=>{send({type:"join",roomId:$("room").value.trim(),name:name()})};
$("back").onclick=()=>location.reload();
for(let n=1;n<=9;n++){let b=document.createElement("button");b.textContent=n;b.id="n"+n;b.onclick=()=>{send({type:"move",number:n});b.classList.add("used");used.push(n);};$("buttons").appendChild(b)}
function handle(m){
 if(m.type==="error"){alert(m.message);return}
 if(m.type==="joined"){me=m.player;roomId=m.roomId;$("roomId").textContent=roomId;$("lobby").classList.add("hidden");$("game").classList.remove("hidden");$("message").textContent=me===1?"相手の参加を待っています…":"ゲーム開始！";return}
 if(m.type==="state"){ $("round").textContent=m.round;$("scores").textContent=`${m.p1Score} - ${m.p2Score}`;
   $("p1state").textContent=m.p1Connected?"接続中":"待機中";$("p2state").textContent=m.p2Connected?"接続中":"待機中";
   if(m.status==="playing")$("message").textContent="数字を1枚選んでください"; return}
 if(m.type==="waiting"){$("message").textContent="相手の選択を待っています…";return}
 if(m.type==="roundResult"){
   $("p1card").classList.remove("hidden");$("p2card").classList.remove("hidden");
   $("p1card").textContent=m.p1;$("p2card").textContent=m.p2;
   $("message").textContent=m.result===0?"引き分け":(m.result===(me===1?1:-1)?"あなたの勝ち！":"あなたの負け…");
   used=[];setTimeout(()=>{for(let n=1;n<=9;n++)$("n"+n).classList.remove("used")},850);return}
 if(m.type==="gameOver"){$("message").textContent=m.winner===0?"引き分け！":(m.winner===me?"あなたの勝利！":"あなたの敗北…");return}
 if(m.type==="opponentLeft"){$("message").textContent="相手が退出しました。";return}
}
connect();