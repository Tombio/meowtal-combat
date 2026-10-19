import { Arena } from '../src/entities/Arena';
import { Cat } from '../src/entities/Cat';
import { CollisionEngine } from '../src/engine/Collision';
import { SoundSynthesizer } from '../src/audio/SoundSynthesizer';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('\n--- 1. Testing Arena Boundaries & Ring Out ---');
const arena = new Arena(960, 540);
assert(arena.config.ringLeft === 190, 'Arena ringLeft is 190px');
assert(arena.config.ringRight === 770, 'Arena ringRight is 770px');
assert(arena.isOnPlatform(400, 56), 'Cat at x=400 is safely on Dohyo platform');
assert(!arena.isOnPlatform(100, 56), 'Cat at x=100 is past left edge');
assert(arena.isRingOut(100, 450, 56), 'Cat at x=100, y=450 triggers Ring Out');
assert(!arena.isRingOut(400, 450, 56), 'Cat in center cannot ring-out vertically');

console.log('\n--- 2. Testing Jump-Over Clearance ---');
const cat1 = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
cat1.jump();
let minY = cat1.y;
for (let frame = 0; frame < 60; frame++) {
  cat1.updatePhysics(arena, false, false, true, 400);
  if (cat1.y < minY) minY = cat1.y;
}
const maxJumpApex = (arena.config.ringSurfaceY - cat1.height) - minY;
console.log(`Max jump altitude achieved: ${maxJumpApex.toFixed(1)}px (Cat height: ${cat1.height}px)`);
assert(maxJumpApex > cat1.height * 2.5, `Jump height (${maxJumpApex.toFixed(1)}px) allows cleanly vaulting over the opponent (${cat1.height}px)`);

console.log('\n--- 3. Testing Height-Advantage Bump Physics ---');
const soundMock = new SoundSynthesizer();
const collision = new CollisionEngine(soundMock);

// Test 3a: Equal height collision (Belly Shove)
const p1_ground = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
const p2_ground = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 430, initialFacing: -1 }, arena.config.ringSurfaceY);

const bumpShove = collision.checkAndResolveCats(p1_ground, p2_ground);
assert(bumpShove !== null, 'Ground collision detected');
assert(bumpShove?.comicText === 'CLASH!', 'Ground collision generates CLASH! shove event');
assert(bumpShove?.heightDelta === 0, 'Ground collision has 0 height delta');
assert(p1_ground.vx < 0 && p2_ground.vx > 0, 'Ground collision pushes both cats apart equally');

// Test 3b: Height Advantage collision (Cat 1 lands from above on Cat 2)
const p1_air = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
const p2_ground2 = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 420, initialFacing: -1 }, arena.config.ringSurfaceY);

// Place p1_air 30px higher than p2
p1_air.y = p2_ground2.y - 30;

const bumpAerial = collision.checkAndResolveCats(p1_air, p2_ground2);
assert(bumpAerial !== null, 'Aerial collision detected');
assert(bumpAerial?.heightDelta === 30, 'Height delta is 30px');
assert(bumpAerial?.higherCat.id === 'p1', 'P1 is detected as the higher cat');
assert(bumpAerial?.lowerCat.id === 'p2', 'P2 is detected as the lower cat');
assert(p2_ground2.state === 'DAZED', 'Lower cat enters DAZED state');
assert(p2_ground2.vx > 6.0, `Lower cat receives well-balanced knockback force (${p2_ground2.vx.toFixed(2)} px/frame)`);
assert(p1_air.vy < 0, `Higher cat receives upward pounce rebound (${p1_air.vy.toFixed(2)} px/frame)`);

console.log('\n--- 4. Testing Knockback Scaling by Height Delta ---');
// Verify that greater height delta gives strictly greater pushback
collision.resetCooldown();
const p1_low_drop = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
const p2_target1 = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 420, initialFacing: -1 }, arena.config.ringSurfaceY);
p1_low_drop.y = p2_target1.y - 15;
collision.checkAndResolveCats(p1_low_drop, p2_target1);
const knockbackLow = Math.abs(p2_target1.vx);

collision.resetCooldown();
const p1_high_drop = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
const p2_target2 = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 420, initialFacing: -1 }, arena.config.ringSurfaceY);
p1_high_drop.y = p2_target2.y - 40;
collision.checkAndResolveCats(p1_high_drop, p2_target2);
const knockbackHigh = Math.abs(p2_target2.vx);

console.log(`Knockback with 15px height drop: ${knockbackLow.toFixed(2)} px/frame`);
console.log(`Knockback with 40px height drop: ${knockbackHigh.toFixed(2)} px/frame`);
assert(knockbackHigh > knockbackLow, 'Higher drop results in strictly greater pushback!');
assert(knockbackHigh <= 7.8, 'Mega bonk is capped at 7.8 px/frame to prevent cheap one-shots!');

console.log('\n--- 5. Testing Bonk Knockback Gravity & Landing (No Floating) ---');
const victim = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 450, initialFacing: -1 }, arena.config.ringSurfaceY);
assert(victim.isGrounded, 'Victim starts grounded on Dohyo');

// Apply tuned mega bonk knockback
victim.applyKnockback(7.8, -2.4, 22);
assert(!victim.isGrounded, 'Victim is correctly flagged airborne when taking vertical impulse');

// Simulate 20 frames of physics with NO player inputs
let peakY = victim.y;
for (let frame = 0; frame < 20; frame++) {
  victim.updatePhysics(arena, false, false, false, 300);
  if (victim.y < peakY) peakY = victim.y;
}

console.log(`Victim initial Y: ${arena.config.ringSurfaceY - victim.height}, peak hop Y: ${peakY.toFixed(1)}, final Y: ${victim.y.toFixed(1)}`);
assert(victim.isGrounded, 'Victim lands back on the Dohyo platform without needing jump key');
assert(victim.y === arena.config.ringSurfaceY - victim.height, 'Victim rests firmly on the platform surface, zero floating!');

console.log('\n--- 6. Testing 3 Rounds Needed to Win Match ---');
import { ArcadeHUD } from '../src/ui/ArcadeHUD';
const hud = new ArcadeHUD();
assert(hud.maxRoundsToWin === 3, 'Tournament configured to require 3 round wins');

const testP1 = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
const testP2 = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 600, initialFacing: -1 }, arena.config.ringSurfaceY);

// Win Round 1
hud.triggerRoundOver(testP2, testP1);
assert(testP1.roundsWon === 1, 'P1 has 1 round win');
assert(testP1.roundsWon < hud.maxRoundsToWin, '1 win does not win match');

// Win Round 2
hud.triggerRoundOver(testP2, testP1);
assert(testP1.roundsWon === 2, 'P1 has 2 round wins');
assert(testP1.roundsWon < hud.maxRoundsToWin, '2 wins does not win match (still needs 3rd win)');

// Win Round 3
hud.triggerRoundOver(testP2, testP1);
assert(testP1.roundsWon === 3, 'P1 has 3 round wins');
assert(testP1.roundsWon >= hud.maxRoundsToWin, '3 wins triggers tournament victory!');

console.log('\n--- 7. Testing Dynamic Round BGM Track Switching ---');
const trackR1 = soundMock.setRoundTrack(1);
console.log(`Round 1 Track: ${trackR1}`);
assert(trackR1.includes('136 BPM'), 'Round 1 loads fast 136 BPM Neo-Dohyo Acid');

const trackR2 = soundMock.setRoundTrack(2);
console.log(`Round 2 Track: ${trackR2}`);
assert(trackR2.includes('110 BPM'), 'Round 2 switches to slower 110 BPM Shinobi Dub');

const trackR3 = soundMock.setRoundTrack(3);
console.log(`Round 3 Track: ${trackR3}`);
assert(trackR3.includes('124 BPM'), 'Round 3 switches to 124 BPM Tokyo Metropolis');

const manualNext = soundMock.nextTrack();
console.log(`Manual Next Track: ${manualNext}`);
assert(manualNext.includes('144 BPM'), 'Next track advances to 144 BPM Final Climax Rave');

console.log('\n🎉 ALL GAMEPLAY SIMULATION TESTS PASSED!\n');
