import {describe,it,expect} from 'vitest';
import {classifyIssues,makeAxle,orderPositions,renumberAxles,validMeasurement} from './domain';

describe('axle positions and order',()=>{
 it('uses standard tire position codes for steer and tandem drive axles',()=>{
  const steer=makeAxle('STEER',1,false,'steer');const drive=makeAxle('DRIVE',1,true,'drive');const second=makeAxle('DRIVE',2,true,'drive-2');
  expect(steer.positions.map(p=>p.code)).toEqual(['LF','RF']);
  expect(drive.positions.map(p=>p.code)).toEqual(['LFO','LFI','RFO','RFI']);
  expect(second.positions.map(p=>p.code)).toEqual(['L2O','L2I','R2O','R2I']);
 });
 it('walks front to rear on the first side, then rear to front on the opposite side',()=>{
  const axles=[makeAxle('STEER',1,false,'s'),makeAxle('DRIVE',1,true,'d1'),makeAxle('DRIVE',2,true,'d2')];
  const left=orderPositions(axles,'LEFT').map(id=>axles.flatMap(a=>a.positions).find(p=>p.id===id)!.code);
  const right=orderPositions(axles,'RIGHT').map(id=>axles.flatMap(a=>a.positions).find(p=>p.id===id)!.code);
  expect(left).toEqual(['LF','LFO','LFI','L2O','L2I','R2O','R2I','RFO','RFI','RF']);
  expect(right).toEqual(['RF','RFO','RFI','R2O','R2I','L2O','L2I','LFO','LFI','LF']);
 });
 it('preserves axle ids, tire specification, and position ids when axle order changes',()=>{
  const a=makeAxle('DRIVE',1,true,'a'),b=makeAxle('DRIVE',2,true,'b');a.spec.targetPSI=111;const moved=renumberAxles([b,a]);
  expect(moved[1].id).toBe('a');expect(moved[1].spec.targetPSI).toBe(111);expect(moved[1].positions[0].id).toBe(a.positions[0].id);expect(moved[1].positions[0].code).toBe('L2O');
 });
});
describe('measurement and issue rules',()=>{
 it('enforces hard numeric input limits',()=>{expect(validMeasurement(32,'TREAD')).toBe(true);expect(validMeasurement(33,'TREAD')).toBe(false);expect(validMeasurement(150,'PRESSURE')).toBe(true);expect(validMeasurement(151,'PRESSURE')).toBe(false);expect(validMeasurement(4.5,'TREAD')).toBe(false)});
 it('flags more than one tire issue without replacing earlier issues',()=>{
  const axle=makeAxle('STEER',1,false,'s');const entry={positionId:'x',code:'LF',label:'Left front',axleType:'STEER' as const,axleSequence:1,treadDepth32nds:3,inspectedPressurePSI:90,observations:[]};
  expect(classifyIssues(entry,'STEER',{...axle.spec,minimumPSI:95},'BOTH')).toEqual(['Low tread','Low pressure']);
 });
 it('does not treat missing measurements as acceptable',()=>{
  const axle=makeAxle('DRIVE',1,true,'d');const result=classifyIssues({positionId:'x',code:'LFO',label:'Left front outer',axleType:'DRIVE',axleSequence:1,observations:[]},'DRIVE',axle.spec,'BOTH');
  expect(result).toEqual([]);
 });
});
