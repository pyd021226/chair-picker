const fs = require('fs');
let content = fs.readFileSync('src/data/chairs.ts', 'utf8');

// Extract JSON array
const start = content.indexOf('export const chairs');
const arrStart = content.indexOf('= [', start) + 2; // skip '= '
let depth = 0, arrEnd = arrStart;
for (let i = arrStart; i < content.length; i++) {
  if (content[i] === '[') depth++;
  if (content[i] === ']') { depth--; if (depth === 0) { arrEnd = i; break; } }
}
const jsonStr = content.slice(arrStart, arrEnd + 1);
const chairs = JSON.parse(jsonStr);

const upgrades = {
  '黑白调-黑白调-p2-ultra': {
    headrestFunc: '升降2cm, 旋转30°',
    armrestFunc: '5D扶手：升降8cm, 前后5cm, 左右旋转, 左右平移2cm, 上翻收纳',
    lumbarFunc: '5D腰托：上下5cm, 前后2cm, 左右旋转自适应',
  },
  '黑白调-黑白调-p2-max-扶手增强版': {
    headrestFunc: '升降2cm, 旋转30°',
    armrestFunc: '4D扶手增强版：升降8cm, 前后5cm, 左右旋转, 左右平移',
    lumbarFunc: '5D大腰托：上下5cm, 前后2cm, 加宽加厚',
  },
  '黑白调-黑白调-x7-ai智能追腰椅': {
    headrestFunc: '升降3cm, 前后角度可调',
    armrestFunc: '4D扶手：升降7cm, 前后4cm, 左右旋转, 左右平移',
    lumbarFunc: 'AI智能追腰自适应：随坐姿自动调节, 行程约3cm',
  },
  '黑白调-黑白调-p2-pro+-二代': {
    headrestFunc: '升降2cm',
    armrestFunc: '3D扶手：升降7cm, 前后4cm, 左右旋转',
    lumbarFunc: '4D腰托：上下4cm, 前后1.5cm',
  },
  '黑白调-黑白调-e3-ultra-ai追腰': {
    headrestFunc: '升降3cm, 旋转40°',
    armrestFunc: '4D扶手：升降8cm, 前后5cm, 左右旋转, 左右平移3cm',
    lumbarFunc: '3区AI追腰自适应：随动贴合, 行程3cm, 宽61.5cm',
  },
  '黑白调-黑白调-t8-max': {
    headrestFunc: '升降3cm, 角度可调',
    armrestFunc: '8D扶手：升降10cm, 前后6cm, 左右旋转, 左右平移, 上翻, 多角度锁定',
    lumbarFunc: '5维撑腰：上下6cm, 前后3cm, 左右自适应, 力度可调',
  },
  '黑白调-黑白调-p2-pro-二代': {
    headrestFunc: '升降2cm, 旋转30°',
    armrestFunc: '3D扶手：升降7cm, 前后4cm, 左右旋转',
    lumbarFunc: '4D腰托：上下4cm, 前后1.5cm',
  },
  '黑白调-黑白调-e3-pro-随动追腰椅': {
    headrestFunc: '升降3cm, 旋转35°',
    armrestFunc: '4D扶手：升降8cm, 前后5cm, 左右旋转, 左右平移',
    lumbarFunc: '3区云翼随动追腰：自适应贴合, 椅背升降8cm',
  },
  '黑白调-黑白调-e3-ultra-按摩热敷': {
    headrestFunc: '升降3cm, 旋转40°',
    armrestFunc: '4D扶手：升降8cm, 前后5cm, 左右旋转, 左右平移3cm',
    lumbarFunc: '3区腰托+按摩热敷：自适应追腰, 加热按摩, 椅背升降7cm',
  },
  '京东京造-京东京造z5-soft-人体工学椅-电脑椅-电竞椅-办公椅子久坐-四维旋转腰靠': {
    headrestFunc: '升降3cm, 旋转20°',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '四维旋转腰靠：旋转自适应, 上下4cm',
  },
  '京东京造-京东京造z5-soft升降扶手-人体工学椅-电脑椅-电竞椅-办公椅-四维旋转腰靠': {
    headrestFunc: '升降3cm, 旋转20°',
    armrestFunc: '升降扶手（双柄）：升降7cm',
    lumbarFunc: '四维旋转腰靠：旋转自适应, 上下4cm',
  },
  '京东京造-z8-pro真皮老板椅-香槟橙': {
    headrestFunc: '固定头枕：不可调',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '无独立腰撑',
  },
  '京东京造-z8-pro真皮老板椅-奶咖白': {
    headrestFunc: '固定头枕：不可调',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '无独立腰撑',
  },
  '京东京造-京东京造z7doze人体工学椅-可躺电脑椅办公椅子老板椅-大角度后仰午休躺椅': {
    headrestFunc: '一体式头枕：不可调',
    armrestFunc: '3D扶手：升降6cm, 前后3cm, 左右旋转',
    lumbarFunc: '固定腰撑：不可调',
  },
  '京东京造-菁英系列-z7-pro-5d-人体工学椅': {
    headrestFunc: '升降4cm, 旋转40°',
    armrestFunc: '5D扶手：升降8cm, 前后5cm, 左右旋转, 左右平移',
    lumbarFunc: '4D腰托：上下5cm, 前后2cm, 左右自适应',
  },
  '京东京造-z7pro-魔术臂人体工学椅-灰色': {
    headrestFunc: '升降4cm, 旋转40°',
    armrestFunc: '魔术臂210°旋转：升降8cm, 前后5cm, 左右平移',
    lumbarFunc: '4D腰托：上下5cm, 前后2cm',
  },
  '京东京造-京东京造软包云朵椅-活力橙': {
    headrestFunc: '无头枕',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '无独立腰撑',
  },
  '京东京造-京东京造软包云朵椅-奶油白': {
    headrestFunc: '无头枕',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '无独立腰撑',
  },
  '京东京造-京东京造软包云朵椅mini-活力橙': {
    headrestFunc: '无头枕',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '无独立腰撑',
  },
  '京东京造-京东京造软包云朵椅mini-奶油白': {
    headrestFunc: '无头枕',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '无独立腰撑',
  },
  '京东京造-京东京造z5pro人体工学椅-固定扶手': {
    headrestFunc: '升降3cm, 旋转25°',
    armrestFunc: '固定扶手：不可调',
    lumbarFunc: '3D腰托：上下4cm, 前后1.5cm',
  },
  '京东京造-京东京造z5pro人体工学椅-3d扶手': {
    headrestFunc: '升降3cm, 旋转25°',
    armrestFunc: '3D扶手：升降7cm, 前后4cm, 左右旋转',
    lumbarFunc: '3D腰托：上下4cm, 前后1.5cm',
  },
  '京东京造-z9pro-二代-人体工学椅-黑色': {
    headrestFunc: '双轴20cm升降, 60°旋转',
    armrestFunc: '5D扶手：升降8cm, 前后5cm, 左右旋转, 左右平移',
    lumbarFunc: '6D全域巡航腰靠：14°前后自适应, 5°左右自适应, 上下5cm',
  },
  '京东京造-z9pro-二代-人体工学椅-灰色': {
    headrestFunc: '双轴20cm升降, 60°旋转',
    armrestFunc: '5D扶手：升降8cm, 前后5cm, 左右旋转, 左右平移',
    lumbarFunc: '6D全域巡航腰靠：14°前后自适应, 5°左右自适应, 上下5cm',
  },
  '京东京造-京东京造-z9ultra-二代人体工学椅-曜夜黑': {
    headrestFunc: '双轴20cm升降, 60°旋转',
    armrestFunc: '4D联动扶手：升降8cm, 前后5cm, 左右旋转, 左右平移（后仰联动）',
    lumbarFunc: '6D全域巡航腰靠：16°前后自适应, 3cm前后手动, 椅背5档升降8cm',
  },
  '京东京造-京东京造-z9ultra-二代人体工学椅-月影灰': {
    headrestFunc: '双轴20cm升降, 60°旋转',
    armrestFunc: '4D联动扶手：升降8cm, 前后5cm, 左右旋转, 左右平移（后仰联动）',
    lumbarFunc: '6D全域巡航腰靠：16°前后自适应, 3cm前后手动, 椅背5档升降8cm',
  },
  '京东京造-京东京造-z9ultra-人体工学椅-曜夜黑': {
    headrestFunc: '双轴18cm升降, 50°旋转',
    armrestFunc: '5D联动扶手：升降8cm, 前后5cm, 左右旋转, 左右平移',
    lumbarFunc: '3D自适应腰靠：随背联动, 椅背5档升降8cm',
  },
  '京东京造-京东京造-z9ultra-人体工学椅-月影灰': {
    headrestFunc: '双轴18cm升降, 50°旋转',
    armrestFunc: '5D联动扶手：升降8cm, 前后5cm, 左右旋转, 左右平移',
    lumbarFunc: '3D自适应腰靠：随背联动, 椅背5档升降8cm',
  },
  '京东京造-z9pro-人体工学椅-黑色': {
    headrestFunc: '双轴16cm升降, 45°旋转',
    armrestFunc: '5D魔术臂：升降7cm, 前后4cm, 左右旋转, 左右平移',
    lumbarFunc: '3D追腰系统：上下4cm, 自适应贴合',
  },
  '京东京造-z9pro-人体工学椅-灰色': {
    headrestFunc: '双轴16cm升降, 45°旋转',
    armrestFunc: '5D魔术臂：升降7cm, 前后4cm, 左右旋转, 左右平移',
    lumbarFunc: '3D追腰系统：上下4cm, 自适应贴合',
  },
  '京东京造-京东京造z5ultra人体工学椅灰色': {
    headrestFunc: '升降3cm, 旋转25°',
    armrestFunc: '3D扶手：升降7cm, 前后4cm, 左右旋转',
    lumbarFunc: '20°悬浮腰托：自适应贴合, 椅背升降3cm',
  },
  '京东京造-京东京造z5ultra人体工学椅黑色': {
    headrestFunc: '升降3cm, 旋转25°',
    armrestFunc: '3D扶手：升降7cm, 前后4cm, 左右旋转',
    lumbarFunc: '20°悬浮腰托：自适应贴合, 椅背升降3cm',
  },
  '京东京造-京东京造z5ultra人体工学椅灰色-带脚托': {
    headrestFunc: '升降3cm, 旋转25°',
    armrestFunc: '3D扶手：升降7cm, 前后4cm, 左右旋转',
    lumbarFunc: '20°悬浮腰托：自适应贴合, 椅背升降3cm',
  },
  '京东京造-京东京造z5ultra人体工学椅黑色-带脚托': {
    headrestFunc: '升降3cm, 旋转25°',
    armrestFunc: '3D扶手：升降7cm, 前后4cm, 左右旋转',
    lumbarFunc: '20°悬浮腰托：自适应贴合, 椅背升降3cm',
  },
};

let updated = 0;
for (const c of chairs) {
  if (upgrades[c.id]) {
    const u = upgrades[c.id];
    if (u.headrestFunc) { c.headrestFunc = u.headrestFunc; updated++; }
    if (u.armrestFunc) { c.armrestFunc = u.armrestFunc; updated++; }
    if (u.lumbarFunc) { c.lumbarFunc = u.lumbarFunc; updated++; }
  }
}

const newContent = content.slice(0, arrStart) + JSON.stringify(chairs, null, 2) + content.slice(arrEnd + 1);
fs.writeFileSync('src/data/chairs.ts', newContent);
console.log('Updated ' + updated + ' fields across ' + Object.keys(upgrades).length + ' chairs');

const notUpgraded = chairs.filter(c => !upgrades[c.id]);
console.log('Not yet updated (' + notUpgraded.length + '):');
for (const c of notUpgraded) {
  console.log('  ' + c.id + ' | ' + (c.headrestFunc||'null').slice(0,20) + ' | ' + (c.lumbarFunc||'null').slice(0,25));
}
