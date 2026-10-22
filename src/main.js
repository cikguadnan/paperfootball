import Phaser from 'phaser';
import './style.css';

const W=1000,H=625, FIELD={left:52,right:948,top:60,bottom:565,goalTop:251,goalBottom:374};
const $=id=>document.getElementById(id);
let scene,players=[],ball,active=null,drag=null,settling=false,goalLock=false,ended=false,scores={blue:0,red:0},lastShot=0,shotCount=0,aimGraphics;
const teams={blue:{color:0x2764c7,name:'BLUE'},red:{color:0xdb4652,name:'RED'}};
const formations={
 blue:[[135,312],[280,140],[280,485],[405,235],[405,390]],
 red:[[865,312],[720,140],[720,485],[595,235],[595,390]]
};
function status(msg){$('status').textContent=msg}
function scoreboard(){$('score').textContent='BLUE '+scores.blue+' : '+scores.red+' RED'}
function paperShape(body,team,number){
 const color=teams[team].color;
 const g=scene.add.graphics().setDepth(5);
 g.fillStyle(0x000000,.16);g.fillEllipse(3,14,38,10);
 g.fillStyle(color,1);g.fillTriangle(-20,12,-13,-20,13,-20);g.fillTriangle(-20,12,13,-20,20,12);
 g.lineStyle(2,0xffffff,1);g.strokeTriangle(-20,12,-13,-20,13,-20);g.strokeTriangle(-20,12,13,-20,20,12);
 g.lineStyle(1,0xffffff,.45);g.lineBetween(0,-18,0,12);
 const label=scene.add.text(0,-8,String(number),{fontFamily:'Arial',fontSize:'18px',fontStyle:'bold',color:'#ffffff',stroke:'#18372c',strokeThickness:2}).setOrigin(.5).setDepth(6);
 const group=scene.add.container(body.position.x,body.position.y,[g,label]).setDepth(5);
 return group;
}
function createPlayer(team,x,y,number){
 const body=scene.matter.add.circle(x,y,19,{friction:.28,frictionStatic:.55,frictionAir:.07,restitution:.55,density:.004,label:'player-'+team});
 body.collisionFilter.group=0;
 const visual=paperShape(body,team,number);
 const p={body,visual,team,number};
 players.push(p);return p;
}
function drawPitch(){
 const g=scene.add.graphics().setDepth(0);
 g.fillStyle(0x2a8955);g.fillRect(0,0,W,H);
 for(let x=0;x<W;x+=100){g.fillStyle(0xffffff,.025);g.fillRect(x,0,50,H)}
 g.lineStyle(3,0xffffff,.85);g.strokeRect(FIELD.left,FIELD.top,FIELD.right-FIELD.left,FIELD.bottom-FIELD.top);
 g.lineBetween(W/2,FIELD.top,W/2,FIELD.bottom);g.strokeCircle(W/2,H/2,78);
 g.strokeRect(FIELD.left,190,120,245);g.strokeRect(FIELD.right-120,190,120,245);
 g.strokeRect(FIELD.left,250,48,125);g.strokeRect(FIELD.right-48,250,48,125);
 g.fillStyle(0xffffff);g.fillCircle(W/2,H/2,4);g.fillCircle(160,H/2,4);g.fillCircle(840,H/2,4);
 g.fillStyle(0xe5e7e2,.6);g.fillRect(25,FIELD.goalTop,27,FIELD.goalBottom-FIELD.goalTop);g.fillRect(FIELD.right,FIELD.goalTop,27,FIELD.goalBottom-FIELD.goalTop);
 g.lineStyle(4,0xffffff);g.strokeRect(25,FIELD.goalTop,27,FIELD.goalBottom-FIELD.goalTop);g.strokeRect(FIELD.right,FIELD.goalTop,27,FIELD.goalBottom-FIELD.goalTop);
}
function makeWalls(){
 const M=scene.matter;
 const wall={isStatic:true,restitution:.65,friction:0,label:'wall'};
 // Top and bottom rebound walls. Side boundaries leave goal mouths open.
 M.add.rectangle(W/2,FIELD.top-15,FIELD.right-FIELD.left+35,30,wall);
 M.add.rectangle(W/2,FIELD.bottom+15,FIELD.right-FIELD.left+35,30,wall);
 for(const x of [FIELD.left-15,FIELD.right+15]){
  const topHeight=FIELD.goalTop-FIELD.top;
  const bottomHeight=FIELD.bottom-FIELD.goalBottom;
  M.add.rectangle(x,FIELD.top+topHeight/2,30,topHeight,wall);
  M.add.rectangle(x,FIELD.goalBottom+bottomHeight/2,30,bottomHeight,wall);
 }
 // Back of the net prevents the ball disappearing off-screen.
 M.add.rectangle(10,H/2,20,FIELD.goalBottom-FIELD.goalTop,{...wall,label:'net'});
 M.add.rectangle(W-10,H/2,20,FIELD.goalBottom-FIELD.goalTop,{...wall,label:'net'});
}
function resetPositions(){
 for(const p of players){scene.matter.body.setPosition(p.body,{x:formations[p.team][p.number-1][0],y:formations[p.team][p.number-1][1]});scene.matter.body.setVelocity(p.body,{x:0,y:0});scene.matter.body.setAngularVelocity(p.body,0)}
 scene.matter.body.setPosition(ball,{x:W/2,y:H/2});
 scene.matter.body.setVelocity(ball,{x:0,y:0});
 scene.matter.body.setAngularVelocity(ball,0);
 goalLock=false;settling=false;drag=null;lastShot=0;selectNearest();
}
function selectNearest(){
 if(ended||goalLock)return;
 let best=null,bestDist=Infinity;
 for(const p of players){const dx=p.body.position.x-ball.position.x,dy=p.body.position.y-ball.position.y,d=dx*dx+dy*dy;if(d<bestDist){bestDist=d;best=p}}
 active=best;
 if(best)status(teams[best.team].name+' #'+best.number+' to flick · Pull backwards from the highlighted player');
}
function score(team){
 if(goalLock||ended)return;
 goalLock=true;active=null;scores[team]++;scoreboard();
 if(scores[team]>=3){ended=true;status('🏆 '+teams[team].name+' WINS! Press NEW MATCH to play again.');return}
 status('⚽ GOAL! '+teams[team].name+' scores. Resetting kick-off…');
 scene.time.delayedCall(1250,()=>{if(!ended)resetPositions()});
}
function newMatch(){
 scores={blue:0,red:0};ended=false;scoreboard();resetPositions();
}
function moving(){
 const bodies=[ball,...players.map(p=>p.body)];
 return bodies.some(b=>Math.hypot(b.velocity.x,b.velocity.y)>.18||Math.abs(b.angularVelocity)>.02);
}
class Pitch extends Phaser.Scene{
 constructor(){super('Pitch')}
 create(){
  scene=this;drawPitch();makeWalls();
  players=[];for(const team of ['blue','red'])formations[team].forEach(([x,y],i)=>createPlayer(team,x,y,i+1));
  ball=this.matter.add.circle(W/2,H/2,10,{friction:.15,frictionStatic:.5,frictionAir:.016,restitution:.8,density:.002,label:'ball'});
  this.add.circle(0,0,10,0xffffff).setStrokeStyle(2,0x263b36).setDepth(9).setName('ballGraphic');
  aimGraphics=this.add.graphics().setDepth(15);
  this.add.circle(0,0,27,0xffe47b,.14).setStrokeStyle(3,0xffdc59).setDepth(4).setName('activeRing');
  this.input.on('pointerdown',pointer=>{
   if(!active||settling||goalLock||ended)return;
   const pos=active.body.position;
   if(Phaser.Math.Distance.Between(pointer.worldX,pointer.worldY,pos.x,pos.y)<48){drag={x:pos.x,y:pos.y,pointerId:pointer.id};status('Pull backwards to aim · Release to flick')}
  });
  this.input.on('pointermove',pointer=>{
   if(!drag||pointer.id!==drag.pointerId||!active)return;
   aimGraphics.clear();
   const dx=drag.x-pointer.worldX,dy=drag.y-pointer.worldY,len=Math.hypot(dx,dy);
   if(len<4)return;
   const scale=Math.min(len,150)/len;
   const ex=drag.x+dx*scale,ey=drag.y+dy*scale;
   aimGraphics.lineStyle(5,0xffe276,.95);aimGraphics.lineBetween(drag.x,drag.y,ex,ey);
   const angle=Math.atan2(dy,dx);
   aimGraphics.fillStyle(0xffe276);aimGraphics.fillTriangle(ex+Math.cos(angle)*13,ey+Math.sin(angle)*13,ex+Math.cos(angle+2.5)*12,ey+Math.sin(angle+2.5)*12,ex+Math.cos(angle-2.5)*12,ey+Math.sin(angle-2.5)*12);
  });
  this.input.on('pointerup',pointer=>{
   if(!drag||pointer.id!==drag.pointerId||!active)return;
   const dx=drag.x-pointer.worldX,dy=drag.y-pointer.worldY;
   const dist=Math.min(150,Math.hypot(dx,dy));
   drag=null;aimGraphics.clear();
   if(dist<10){status('Pull back further to flick');return}
   const mag=dist/150*.11;
   this.matter.body.applyForce(active.body,active.body.position,{x:dx/Math.hypot(dx,dy)*mag,y:dy/Math.hypot(dx,dy)*mag});
   active=null;settling=true;lastShot=this.time.now;shotCount++;
   status('Ball in play · Waiting for all pieces to stop…');
  });
  this.input.on('pointerupoutside',()=>{drag=null;aimGraphics.clear()});
  this.matter.world.on('collisionstart',event=>{
   for(const pair of event.pairs){if((pair.bodyA===ball||pair.bodyB===ball)&&!goalLock){}}
  });
  newMatch();
 }
 update(time){
  for(const p of players){p.visual.setPosition(p.body.position.x,p.body.position.y);p.visual.setRotation(p.body.angle)}
  const b=this.children.getByName('ballGraphic');b.setPosition(ball.position.x,ball.position.y);
  const ring=this.children.getByName('activeRing');ring.setVisible(!!active&&!settling&&!ended);if(active)ring.setPosition(active.body.position.x,active.body.position.y);
  if(!goalLock&&!ended){
   if(ball.position.x<FIELD.left-4&&ball.position.y>FIELD.goalTop&&ball.position.y<FIELD.goalBottom)score('red');
   else if(ball.position.x>FIELD.right+4&&ball.position.y>FIELD.goalTop&&ball.position.y<FIELD.goalBottom)score('blue');
  }
  if(settling&&!goalLock&&time-lastShot>650){
   if(!moving()||time-lastShot>9000){
    // Force lingering micro-movements to rest before selecting the next turn.
    for(const body of [ball,...players.map(p=>p.body)]){this.matter.body.setVelocity(body,{x:0,y:0});this.matter.body.setAngularVelocity(body,0)}
    settling=false;selectNearest();
   }
  }
 }
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:W,height:H,backgroundColor:'#2a8955',physics:{default:'matter',matter:{gravity:{y:0},enableSleeping:false,debug:false}},scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Pitch]});
$('restart').addEventListener('click',()=>{if(scene)newMatch()});
