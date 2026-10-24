export type EquipmentType = 'TRUCK' | 'TRAILER';
export type AxleType = 'STEER' | 'TAG' | 'DRIVE';
export type Side = 'LEFT' | 'RIGHT';
export type MeasureMode = 'TREAD' | 'PRESSURE' | 'BOTH';
export type TireStatus = 'ACCEPTABLE' | 'FLAT' | 'BLOWNOUT' | 'SKIPPED';
export type InspectionStatus = 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export interface Location { id:string; name:string; notes?:string }
export interface Customer { id:string; name:string; contactName:string; contactPhone:string; notes:string; locations:Location[] }
export interface TireSpec { brand:string; size:string; plyRating:string; minimumPSI:number; maximumPSI:number; targetPSI:number; replacementTread32nds:number }
export interface TirePosition { id:string; code:string; label:string; side:Side; sequence:number }
export interface Axle { id:string; type:AxleType; sequence:number; dual:boolean; positions:TirePosition[]; spec:TireSpec }
export interface Equipment { id:string; customerId:string; locationId:string; equipmentNumber:string; type:EquipmentType; axles:Axle[]; active:boolean; updatedAt:string }
export interface TireEntry { positionId:string; code:string; label:string; axleType:AxleType; axleSequence:number; treadDepth32nds?:number; inspectedPressurePSI?:number; status?:TireStatus; skipped?:boolean; note?:string; observations:string[]; photographs?:string[]; intendedPSI?:number; airUpStatus?:'PENDING'|'COMPLETED'|'SKIPPED' }
export interface Inspection { id:string; batchId?:string; customerId:string; locationId:string; equipmentId:string; equipmentNumber:string; equipmentType:EquipmentType; locationName:string; axleSnapshot:Axle[]; status:InspectionStatus; mode:MeasureMode; startingSide:Side; sequence:string[]; currentIndex:number; entries:TireEntry[]; startedAt:string; updatedAt:string; completedAt?:string }
export type Page = 'customers'|'equipment'|'inspections'|'history'|'unfinished'|'settings';
export const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const spec=(replacementTread32nds:number):TireSpec=>({brand:'Michelin',size:'11R22.5',plyRating:'16 ply',minimumPSI:95,maximumPSI:120,targetPSI:105,replacementTread32nds});
export function makeAxle(type:AxleType, sequence:number, dual:boolean, id=uid()):Axle {
  let stem='';
  if(type==='STEER') stem='F';
  else if(type==='TAG') stem='T';
  else stem=sequence===1?(dual?'F':'FD'):String(sequence);
  const specs=spec(type==='STEER'?4:2);
  const positions:TirePosition[]=[];
  for(const side of ['LEFT','RIGHT'] as Side[]){
    const prefix=side==='LEFT'?'L':'R';
    if(dual){ positions.push({id:uid(),code:`${prefix}${stem}O`,label:`${side==='LEFT'?'Left':'Right'} ${type==='STEER'?'Front':type==='TAG'?'Tag':'Drive'} Outer`,side,sequence:positions.length}); positions.push({id:uid(),code:`${prefix}${stem}I`,label:`${side==='LEFT'?'Left':'Right'} ${type==='STEER'?'Front':type==='TAG'?'Tag':'Drive'} Inner`,side,sequence:positions.length}); }
    else positions.push({id:uid(),code:`${prefix}${stem}`,label:`${side==='LEFT'?'Left':'Right'} ${type==='STEER'?'Front':type==='TAG'?'Tag':'Drive'}`,side,sequence:positions.length});
  }
  return {id,type,sequence,dual,positions,spec:specs};
}
export function renumberAxles(axles:Axle[]):Axle[] {
 const driveNumbers=new Map<string,number>();let drive=0;
 axles.forEach(a=>{if(a.type==='DRIVE')driveNumbers.set(a.id,++drive)});
 return axles.map((a,index)=>{
  const sequence=index+1;
  const sameTypeOrdinal=a.type==='DRIVE'?driveNumbers.get(a.id)!:axles.slice(0,index+1).filter(x=>x.type===a.type).length;
  const generated=makeAxle(a.type,sameTypeOrdinal,a.dual,a.id);
  const positions=generated.positions.map((p,n)=>({...p,id:a.positions.find(old=>old.side===p.side&&((old.code.endsWith('O')&&p.code.endsWith('O'))||(old.code.endsWith('I')&&p.code.endsWith('I'))||(!old.code.endsWith('O')&&!old.code.endsWith('I')&&!p.code.endsWith('O')&&!p.code.endsWith('I'))))?.id||p.id,sequence:n}));
  return {...a,sequence,positions};
 });
}
export function orderPositions(axles:Axle[], startingSide:Side):string[] {
 const front=[...axles].sort((a,b)=>a.sequence-b.sequence); const back=[...front].reverse();
 const sideOrder:Side[]=[startingSide,startingSide==='LEFT'?'RIGHT':'LEFT'];
 return sideOrder.flatMap((side,index)=> (index===0?front:back).flatMap(axle=>axle.positions.filter(p=>p.side===side).sort((a,b)=>a.sequence-b.sequence).map(p=>p.id)));
}
export function classifyIssues(entry:TireEntry, axleType:AxleType, spec:TireSpec, mode:MeasureMode):string[] {
 const issues:string[]=[]; if(entry.status==='FLAT') issues.push('Flat'); if(entry.status==='BLOWNOUT') issues.push('Blown out'); if(entry.skipped||entry.status==='SKIPPED') issues.push('Skipped');
 const threshold=spec.replacementTread32nds??(axleType==='STEER'?4:2);
 if((mode==='TREAD'||mode==='BOTH')&&entry.treadDepth32nds!==undefined&&entry.treadDepth32nds<=threshold) issues.push('Low tread');
 if((mode==='PRESSURE'||mode==='BOTH')&&entry.inspectedPressurePSI!==undefined){if(entry.inspectedPressurePSI<spec.minimumPSI)issues.push('Low pressure'); if(entry.inspectedPressurePSI>spec.maximumPSI)issues.push('High pressure');}
 return issues;
}
export function validMeasurement(value:number,kind:'TREAD'|'PRESSURE'){return Number.isInteger(value)&&value>=0&&value<=(kind==='TREAD'?32:150)}
export function seedData(){
 const c:Customer={id:'cust-demo',name:'Pittsburgh Freight Lines',contactName:'Jordan Miller',contactPhone:'(412) 555-0184',notes:'Primary fleet account',locations:[{id:'loc-freedom',name:'Freedom Yard'},{id:'loc-terminal',name:'Main Terminal'}]};
 const truckAxles=[makeAxle('STEER',1,false,'ax-steer'),makeAxle('DRIVE',1,true,'ax-drive'),makeAxle('DRIVE',2,true,'ax-drive2')];
 const trailerAxles=[makeAxle('TAG',1,true,'ax-trailer1'),makeAxle('TAG',2,true,'ax-trailer2')];
 // Stable IDs make the demonstration inspection deterministic.
 const e1:Equipment={id:'eq-1042',customerId:c.id,locationId:'loc-freedom',equipmentNumber:'1042',type:'TRUCK',axles:truckAxles,active:true,updatedAt:new Date().toISOString()};
 const e2:Equipment={id:'eq-208',customerId:c.id,locationId:'loc-freedom',equipmentNumber:'208',type:'TRAILER',axles:trailerAxles,active:true,updatedAt:new Date().toISOString()};
 const e3:Equipment={id:'eq-1056',customerId:c.id,locationId:'loc-terminal',equipmentNumber:'1056',type:'TRUCK',axles:[makeAxle('STEER',1,false),makeAxle('DRIVE',1,true)],active:true,updatedAt:new Date().toISOString()};
 return {customers:[c],equipment:[e1,e2,e3],inspections:[] as Inspection[],queue:[] as string[]};
}
