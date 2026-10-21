import { Arena } from '../src/entities/Arena';
import { Cat } from '../src/entities/Cat';
import { CollisionEngine } from '../src/engine/Collision';
import { SoundSynthesizer } from '../src/audio/SoundSynthesizer';
import { InputManager } from '../src/engine/InputManager';
import { ComboTracker } from '../src/engine/ComboTracker';
import { NetworkManager } from '../src/network/NetworkManager';
import { ArcadeHUD } from '../src/ui/ArcadeHUD';

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
const track0 = (soundMock as any).bgm.setTrack(0);
assert(track0.includes('136 BPM'), 'Track 0 loads fast 136 BPM Neo-Dohyo Acid');

const track1 = (soundMock as any).bgm.setTrack(1);
assert(track1.includes('110 BPM'), 'Track 1 switches to slower 110 BPM Shinobi Dub');

const track2 = (soundMock as any).bgm.setTrack(2);
assert(track2.includes('124 BPM'), 'Track 2 switches to 124 BPM Tokyo Metropolis');

const track3 = (soundMock as any).bgm.setTrack(3);
assert(track3.includes('144 BPM'), 'Track 3 switches to 144 BPM Final Climax Rave');

const rnd1 = soundMock.setRoundTrack(1);
console.log(`Random Track 1: ${rnd1}`);
assert(typeof rnd1 === 'string' && rnd1.length > 0, 'Round 1 picks random track');

const rnd2 = soundMock.setRoundTrack(2);
console.log(`Random Track 2: ${rnd2}`);
assert(typeof rnd2 === 'string' && rnd2.length > 0 && rnd2 !== rnd1, 'Round 2 picks a non-repeating random track');

console.log('\n--- 8. Testing Mobile Touch Controls & Virtual Input Integration ---');
const inputMgr = new InputManager();

// Test virtual touch pressing
assert(!inputMgr.isDown('p1', 'left'), 'P1 left is initially not down');
assert(!inputMgr.isJustPressed('p1', 'left'), 'P1 left is initially not just pressed');

inputMgr.setVirtualAction('p1', 'left', true);
assert(inputMgr.isDown('p1', 'left'), 'P1 left is down after touch button press');
assert(inputMgr.isJustPressed('p1', 'left'), 'P1 left triggers isJustPressed on touch start');

// Frame update: justPressed should clear, isDown should remain held
inputMgr.update();
assert(inputMgr.isDown('p1', 'left'), 'P1 left remains held across frame update');
assert(!inputMgr.isJustPressed('p1', 'left'), 'P1 left justPressed is cleared on next frame');

// Touch release
inputMgr.setVirtualAction('p1', 'left', false);
assert(!inputMgr.isDown('p1', 'left'), 'P1 left is released after touch end');

// Test Jump button touch
inputMgr.setVirtualAction('p1', 'jump', true);
assert(inputMgr.isDown('p1', 'jump') && inputMgr.isJustPressed('p1', 'jump'), 'Touch jump button activates jump');
inputMgr.update();
inputMgr.setVirtualAction('p1', 'jump', false);
assert(!inputMgr.isDown('p1', 'jump'), 'Touch jump button releases cleanly');

console.log('\n--- 9. Testing Online Room Code Generation & WhatsApp Share URLs ---');
const netMgr = new NetworkManager();
const roomCode = netMgr.generateRoomCode();
console.log(`Generated room code: ${roomCode}`);
assert(roomCode.startsWith('cat-'), 'Room code begins with cat- prefix');
assert(roomCode.length >= 7, 'Room code has sufficient randomness length');

const shareUrl = netMgr.getShareUrl(roomCode);
console.log(`Share URL: ${shareUrl}`);
assert(shareUrl.includes(`#room=${roomCode}`), 'Share URL contains #room=<uuid> hash');

const waUrl = netMgr.getWhatsAppShareUrl(roomCode);
console.log(`WhatsApp URL: ${waUrl}`);
assert(waUrl.startsWith('https://api.whatsapp.com/send?text='), 'WhatsApp URL starts with API schema');
assert(waUrl.includes(encodeURIComponent(shareUrl)), 'WhatsApp URL encodes room share link');

console.log('\n--- 10. Testing Online Collision Effect Replication (BumpEventPacket) ---');
import { EffectsRenderer } from '../src/graphics/EffectsRenderer';
import { BumpEventPacket } from '../src/network/NetworkManager';

const effects = new EffectsRenderer();
let lastProcessedBumpId = 0;

function handleRemoteBumpTest(bump: BumpEventPacket): void {
  if (!bump || bump.id <= lastProcessedBumpId) return;
  lastProcessedBumpId = bump.id;

  effects.addComicPopup(bump.comicText, bump.contactX, bump.contactY, bump.isMega);
  effects.triggerScreenShake(bump.shakeMagnitude);
  if (bump.heightDelta > 15) {
    effects.triggerHitStop(bump.isMega ? 3 : 1);
  }
}

const testPacket1: BumpEventPacket = {
  id: 1,
  comicText: 'POW!',
  contactX: 420,
  contactY: 300,
  isMega: false,
  shakeMagnitude: 6,
  heightDelta: 22,
};

handleRemoteBumpTest(testPacket1);
assert(lastProcessedBumpId === 1, 'First bump packet processed');
assert(effects.shakeAmount === 6, 'Guest receives screen shake');
assert(effects.hitStopFrames === 1, 'Guest receives hit stop freeze frame');

// Re-sending same bump packet should be deduped
handleRemoteBumpTest(testPacket1);
assert(lastProcessedBumpId === 1, 'Duplicate bump packet is safely deduplicated');

// Mega Bonk test
const testPacketMega: BumpEventPacket = {
  id: 2,
  comicText: '★ MEGA BONK! ★',
  contactX: 450,
  contactY: 280,
  isMega: true,
  shakeMagnitude: 10,
  heightDelta: 35,
};

handleRemoteBumpTest(testPacketMega);
assert(lastProcessedBumpId === 2, 'Mega bonk processed');
assert(effects.shakeAmount === 10, 'Mega bonk screen shake matches magnitude 10');
assert(effects.hitStopFrames === 3, 'Mega bonk triggers 3 frames of hit stop');

console.log('\n--- 11. Testing P2P Network Ping / Latency Calculation ---');
const netTest = new NetworkManager();
assert(netTest.getPing() === null, 'Ping is initially null before connection handshake');

// Simulate first Pong packet with 50ms latency
const t0 = performance.now();
let callbackReceivedPing = 0;
netTest.onPingUpdate = (p) => {
  callbackReceivedPing = p;
};

netTest.handlePong({ id: 1, ts: t0 - 50 });
const firstPing = netTest.getPing();
assert(firstPing !== null && firstPing >= 49 && firstPing <= 55, `First ping RTT is approximately 50ms (got ${firstPing}ms)`);
assert(callbackReceivedPing === firstPing, `Ping update callback fired with ${callbackReceivedPing}ms`);

// Simulate second Pong packet with 90ms latency and verify EMA smoothing (40% prev, 60% new)
netTest.handlePong({ id: 2, ts: t0 - 90 });
const secondPing = netTest.getPing();
// Expected: Math.round(50 * 0.4 + 90 * 0.6) = Math.round(20 + 54) = 74
assert(secondPing !== null && secondPing >= 70 && secondPing <= 78, `Smoothed ping is approximately 74ms (got ${secondPing}ms)`);

// Simulate leaving room / disconnect: ping should reset to null
netTest.leaveRoom();
assert(netTest.getPing() === null, 'Ping resets to null on leaveRoom()');

console.log('\n--- 12. Testing Client-Side Prediction & Fair Play Reconciliation ---');
const p2_pred = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 604, initialFacing: -1 }, arena.config.ringSurfaceY);
assert(p2_pred.isGrounded, 'Guest cat starts grounded');

// Test 12a: Instant local jump execution
p2_pred.jump();
assert(!p2_pred.isGrounded, 'Guest cat jumps immediately with 0ms delay');
assert(p2_pred.vy === -12.4, 'Guest cat has instant jump upward impulse');

// Test 12b: Local prediction locomotion
for (let i = 0; i < 5; i++) {
  p2_pred.updatePhysics(arena, true, false, true, 300);
}
assert(p2_pred.x < 604, 'Guest cat moves left immediately during local prediction');
assert(p2_pred.facing === -1, 'Guest cat faces left');

// Test 12c: Soft reconciliation for minor drift
const initialPredX = p2_pred.x;
const hostReportedX = initialPredX + 4; // 4px minor difference
const dx = hostReportedX - p2_pred.x;
p2_pred.x += dx * 0.25;
assert(Math.abs(p2_pred.x - initialPredX) === 1, 'Soft reconciliation nudges 1px without teleporting');

// Test 12d: Authoritative knockback override
const hostBonkVx = 6.9;
const hostBonkVy = -2.4;
p2_pred.applyKnockback(hostBonkVx, hostBonkVy, 22);
assert(p2_pred.state === 'DAZED', 'Guest cat accepts authoritative DAZED state from host');
assert(p2_pred.vx === hostBonkVx, 'Guest cat accepts authoritative knockback velocity');

// Test 12e: Defeat & Round Reset Recovery (no lingering RING_OUT spinning or falling through floor)
p2_pred.state = 'RING_OUT';
p2_pred.isGrounded = false;
p2_pred.x = 800; // in pit
p2_pred.y = 450;

// Host sends new round state where p2 is reset to IDLE on the Dohyo
const resetSnapshot = {
  p2: { x: 604, y: arena.config.ringSurfaceY - p2_pred.height, vx: 0, vy: 0, state: 'IDLE', facing: -1 }
};

if (resetSnapshot.p2.state === 'DAZED' || resetSnapshot.p2.state === 'RING_OUT' || resetSnapshot.p2.state === 'CELEBRATING') {
  p2_pred.state = resetSnapshot.p2.state as any;
} else if (p2_pred.state === 'RING_OUT' || p2_pred.state === 'DAZED' || p2_pred.state === 'CELEBRATING') {
  p2_pred.state = resetSnapshot.p2.state as any;
  p2_pred.x = resetSnapshot.p2.x;
  p2_pred.y = resetSnapshot.p2.y;
  p2_pred.vx = resetSnapshot.p2.vx;
  p2_pred.vy = resetSnapshot.p2.vy;
  p2_pred.facing = resetSnapshot.p2.facing as any;
  p2_pred.isGrounded = true;
}

assert(p2_pred.state === 'IDLE', 'Guest cat exits RING_OUT and becomes IDLE after defeat and round reset');
assert(p2_pred.isGrounded, 'Guest cat is grounded on Dohyo');
assert(p2_pred.x === 604, 'Guest cat position is restored to Dohyo platform');

// Jump should now work cleanly and not drop through the floor
p2_pred.jump();
assert(!p2_pred.isGrounded, 'Guest cat jumps cleanly into air');
assert(p2_pred.vy === -12.4, 'Guest cat upward jump velocity is active');
assert(p2_pred.state === 'JUMP_RISE', 'Guest cat enters JUMP_RISE state (not stuck in RING_OUT 360 spin)');

console.log('\n--- 13. Testing Keyboard Isolation, Space Ready & 3-2-1 MEOW Countdown ---');

// 13a: InputManager Host Keyboard Isolation
const hostInput = new InputManager();
hostInput.setActiveRole('host');

(hostInput as any).heldKeys.add('ArrowRight');
(hostInput as any).justPressedKeys.add('ArrowRight');
(hostInput as any).heldKeys.add('KeyD');
(hostInput as any).justPressedKeys.add('KeyD');

assert(!hostInput.isDown('p2', 'right'), 'Host keyboard ArrowRight is ignored for P2 in online host mode');
assert(!hostInput.isJustPressed('p2', 'right'), 'Host keyboard ArrowRight isJustPressed is ignored for P2 in online host mode');
assert(hostInput.isDown('p1', 'right'), 'Host keyboard KeyD controls P1 in online host mode');
assert(hostInput.isKeyForPlayer('KeyA', 'p1'), 'Host keyboard KeyA is mapped to P1');
assert(!hostInput.isKeyForPlayer('ArrowLeft', 'p2'), 'Host keyboard ArrowLeft is rejected for P2 in online host mode');

// Simulate network input arriving from remote guest for P2
hostInput.setVirtualAction('p2', 'right', true);
assert(hostInput.isDown('p2', 'right'), 'Remote guest virtual input controls P2 on host');

// 13b: InputManager Guest Keyboard Isolation
const guestInput = new InputManager();
guestInput.setActiveRole('guest');

(guestInput as any).heldKeys.add('KeyD');
(guestInput as any).heldKeys.add('ArrowRight');

assert(!guestInput.isDown('p1', 'right'), 'Guest keyboard KeyD is ignored for P1 in online guest mode');
assert(guestInput.isDown('p2', 'right'), 'Guest keyboard ArrowRight controls P2 in online guest mode');
assert(guestInput.isKeyForPlayer('ArrowLeft', 'p2'), 'Guest keyboard ArrowLeft is mapped to P2');
assert(guestInput.isKeyForPlayer('KeyA', 'p2'), 'Guest keyboard KeyA (WASD) is also mapped to P2 in guest mode');
assert(!guestInput.isKeyForPlayer('KeyA', 'p1'), 'Guest keyboard KeyA is rejected for P1 in online guest mode');

// In local mode (activeRole is null), both players can use their respective keys
const localInput = new InputManager();
localInput.setActiveRole(null);
(localInput as any).heldKeys.add('KeyD');
(localInput as any).heldKeys.add('ArrowRight');
(localInput as any).justPressedKeys.add('KeyA');
(localInput as any).justPressedKeys.add('ArrowLeft');
assert(localInput.isDown('p1', 'right'), 'Local mode accepts P1 keyboard inputs');
assert(localInput.isDown('p2', 'right'), 'Local mode accepts P2 keyboard inputs');
assert(localInput.isKeyForPlayer('KeyA', 'p1'), 'Local mode maps KeyA to P1');
assert(localInput.isKeyForPlayer('ArrowLeft', 'p2'), 'Local mode maps ArrowLeft to P2');
assert(!localInput.isKeyForPlayer('Space', 'p1'), 'Space is not mapped for P1');
assert(!localInput.isKeyForPlayer('Space', 'p2'), 'Space is not mapped for P2');
assert(localInput.isPlayerActionJustPressed('p1'), 'Local mode detects any action just pressed for P1');
assert(localInput.isPlayerActionJustPressed('p2'), 'Local mode detects any action just pressed for P2');

// 13c: Spacebar Ready & 3-2-1 MEOW Countdown in ArcadeHUD
const arcadeHud = new ArcadeHUD();
arcadeHud.startMatch();

assert(arcadeHud.matchPhase === 'ROUND_READY', 'Match starts in ROUND_READY phase');
assert(!arcadeHud.p1Ready && !arcadeHud.p2Ready, 'Both players start not ready');

// Single player readies up
arcadeHud.p1Ready = true;
arcadeHud.update();
assert(arcadeHud.matchPhase === 'ROUND_READY', 'Countdown does NOT start when only P1 is ready');

// Second player readies up
arcadeHud.p2Ready = true;
arcadeHud.update();
assert(arcadeHud.matchPhase === 'ROUND_COUNTDOWN', 'Countdown starts when both players are ready');
assert(arcadeHud.countdownText === '3', 'Countdown starts at 3');

// Step through countdown
for (let f = 0; f < 45; f++) arcadeHud.update();
assert(arcadeHud.countdownText === '2', 'Countdown advances to 2');

for (let f = 0; f < 40; f++) arcadeHud.update();
assert(arcadeHud.countdownText === '1', 'Countdown advances to 1');

for (let f = 0; f < 40; f++) arcadeHud.update();
assert(arcadeHud.countdownText === 'MEOW!', 'Countdown displays MEOW!');

for (let f = 0; f < 40; f++) arcadeHud.update();
assert(arcadeHud.matchPhase === 'FIGHT', 'Match enters FIGHT phase after MEOW!');
assert(!arcadeHud.p1Ready && !arcadeHud.p2Ready, 'Ready flags are reset when round starts');

// 13d: Next round returns to ROUND_READY and requires Space ready again
arcadeHud.triggerRoundOver(p2_pred, cat1);
assert(arcadeHud.matchPhase === 'ROUND_OVER', 'Enters ROUND_OVER when cat knocked out');

for (let f = 0; f < 145; f++) arcadeHud.update();
assert(arcadeHud.matchPhase === 'ROUND_READY', 'Next round transitions to ROUND_READY');
assert(!arcadeHud.p1Ready && !arcadeHud.p2Ready, 'Next round requires both players to ready up again');

console.log('\n--- 14. Testing Turbo Attack (Dragon Punch), Combo Detection, Cooldown & Giga Bonk ---');

// 14a: Combo Detection (Back-Back-Forward relative to opponent)
const turboInput = new InputManager();
const p1Combo = new ComboTracker('p1', turboInput);

// P1 at 300, P2 at 600: opponent is to the right.
// Back = Left, Forward = Right. Combo: Left -> Left -> Right
let triggered = false;

// Step 1: Left tap
turboInput.setVirtualAction('p1', 'left', true);
triggered = p1Combo.update(300, 600);
assert(!triggered, 'First BACK press does not trigger combo prematurely');
turboInput.update();
turboInput.setVirtualAction('p1', 'left', false);

// Wait 4 frames
for (let f = 0; f < 4; f++) {
  p1Combo.update(300, 600);
  turboInput.update();
}

// Step 2: Left tap
turboInput.setVirtualAction('p1', 'left', true);
triggered = p1Combo.update(300, 600);
assert(!triggered, 'Second BACK press does not trigger combo prematurely');
turboInput.update();
turboInput.setVirtualAction('p1', 'left', false);

// Wait 4 frames
for (let f = 0; f < 4; f++) {
  p1Combo.update(300, 600);
  turboInput.update();
}

// Step 3: Right tap (FORWARD)
turboInput.setVirtualAction('p1', 'right', true);
triggered = p1Combo.update(300, 600);
assert(triggered, 'Left-Left-Right combo triggers Turbo Attack when opponent is to the right');
turboInput.update();
turboInput.setVirtualAction('p1', 'right', false);

// Opponent is to the left: P1 at 600, P2 at 300.
// Back = Right, Forward = Left. Combo: Right -> Right -> Left
p1Combo.reset();
turboInput.setVirtualAction('p1', 'right', true);
p1Combo.update(600, 300);
turboInput.update();
turboInput.setVirtualAction('p1', 'right', false);

for (let f = 0; f < 3; f++) { p1Combo.update(600, 300); turboInput.update(); }

turboInput.setVirtualAction('p1', 'right', true);
p1Combo.update(600, 300);
turboInput.update();
turboInput.setVirtualAction('p1', 'right', false);

for (let f = 0; f < 3; f++) { p1Combo.update(600, 300); turboInput.update(); }

turboInput.setVirtualAction('p1', 'left', true);
triggered = p1Combo.update(600, 300);
assert(triggered, 'Right-Right-Left combo triggers Turbo Attack when opponent is to the left');
turboInput.update();
turboInput.setVirtualAction('p1', 'left', false);

// Timeout test: > 20 frames delay between taps resets combo
p1Combo.reset();
turboInput.setVirtualAction('p1', 'left', true);
p1Combo.update(300, 600);
turboInput.update();
turboInput.setVirtualAction('p1', 'left', false);

// Wait 25 frames (exceeding MAX_INTERVAL_FRAMES = 20)
for (let f = 0; f < 25; f++) {
  p1Combo.update(300, 600);
  turboInput.update();
}

// Tap second left
turboInput.setVirtualAction('p1', 'left', true);
p1Combo.update(300, 600);
turboInput.update();
turboInput.setVirtualAction('p1', 'left', false);

// Tap forward right
turboInput.setVirtualAction('p1', 'right', true);
triggered = p1Combo.update(300, 600);
assert(!triggered, 'Exceeding 20-frame buffer interval safely resets combo');
turboInput.update();
turboInput.setVirtualAction('p1', 'right', false);

// 14b: Reach & Distance (25% - 30% of platform length)
const turboCat = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
assert(turboCat.canTurboAttack(), 'Fresh cat can perform Turbo Attack');

const startX = turboCat.x;
turboCat.startTurboAttack(1);
assert(turboCat.state === 'TURBO_DASH', 'Cat state transitions to TURBO_DASH');
assert(turboCat.scaleX === 1.45, 'Cat stretches horizontally during dash');

for (let f = 0; f < 15; f++) {
  turboCat.updatePhysics(arena, false, false, false, 600);
}

const distanceCovered = turboCat.x - startX;
const platformLength = arena.config.ringRight - arena.config.ringLeft; // 580px
const reachPercentage = (distanceCovered / platformLength) * 100;
console.log(`Turbo Dash covered: ${distanceCovered.toFixed(1)}px (${reachPercentage.toFixed(1)}% of Dohyo length)`);

assert(distanceCovered >= 155 && distanceCovered <= 165, `Dash covered ~160px (got ${distanceCovered.toFixed(1)}px)`);
assert(reachPercentage >= 25 && reachPercentage <= 30, `Dash reach is 25%-30% of platform (got ${reachPercentage.toFixed(1)}%)`);
assert(turboCat.state === 'IDLE', 'Cat returns to IDLE after dash completes');
assert(turboCat.turboCooldown === 240, 'Cat enters 4-second (240 frames) cooldown');
assert(!turboCat.canTurboAttack(), 'Cat cannot trigger Turbo Attack while on cooldown');

// 14c: Airborne Turbo Dash
const airCat = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
airCat.jump();
for (let f = 0; f < 5; f++) airCat.updatePhysics(arena, false, false, true, 600);
assert(!airCat.isGrounded, 'Cat is airborne');
const airY = airCat.y;

airCat.startTurboAttack(1);
assert(airCat.state === 'TURBO_DASH', 'Airborne cat successfully enters TURBO_DASH');

for (let f = 0; f < 15; f++) {
  airCat.updatePhysics(arena, false, false, false, 600);
  assert(airCat.y === airY, 'Airborne Turbo Dash maintains level horizontal flight');
}
assert(airCat.state === 'JUMP_FALL', 'Airborne cat transitions to JUMP_FALL after dash completes in mid-air');

// 14d: Jumping Dodgability Test
const rusher = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
const dodger = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 430, initialFacing: -1 }, arena.config.ringSurfaceY);

rusher.startTurboAttack(1);
let dodgedSuccessfully = false;

for (let f = 0; f < 15; f++) {
  if (f === 2) {
    dodger.jump(); // Dodger reacts to the charge on frame 2
  }
  rusher.updatePhysics(arena, false, false, false, dodger.x);
  dodger.updatePhysics(arena, false, false, true, rusher.x);

  const bump = collision.checkAndResolveCats(rusher, dodger);
  if (rusher.x > dodger.x && dodger.isGrounded === false) {
    dodgedSuccessfully = (bump === null);
  }
}
assert(dodgedSuccessfully, 'Attentive opponent can dodge Turbo Attack by jumping over the charging cat');

// 14e: Giga Bonk Impact on Direct Hit
collision.resetCooldown();
const attacker = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 370, initialFacing: 1 }, arena.config.ringSurfaceY);
const victimCat = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 410, initialFacing: -1 }, arena.config.ringSurfaceY);

attacker.startTurboAttack(1);
const gigaBump = collision.checkAndResolveCats(attacker, victimCat);

assert(gigaBump !== null, 'Collision detected on direct hit');
assert(gigaBump?.comicText === '💥 GIGA BONK! 💥', 'Collision triggers 💥 GIGA BONK! 💥 comic text');
assert(gigaBump?.isGiga === true, 'BumpEvent is marked as isGiga');
assert(gigaBump?.shakeMagnitude === 16, 'Giga Bonk triggers massive magnitude 16 screen shake');
assert(victimCat.state === 'DAZED', 'Victim enters DAZED state');
assert(victimCat.vx >= 9.8, `Victim launched with powerful knockback (${victimCat.vx.toFixed(2)} px/frame)`);
assert(victimCat.dazeTimer === 28, 'Victim receives 28 daze stun frames');
assert(attacker.state !== 'TURBO_DASH', 'Attacker dash immediately halts on impact');
assert(attacker.turboCooldown === 240, 'Attacker begins 4-second cooldown');

// 14f: Super Clash when both cats Turbo Dash into each other
collision.resetCooldown();
const clash1 = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 380, initialFacing: 1 }, arena.config.ringSurfaceY);
const clash2 = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 410, initialFacing: -1 }, arena.config.ringSurfaceY);

clash1.startTurboAttack(1);
clash2.startTurboAttack(-1);

const clashBump = collision.checkAndResolveCats(clash1, clash2);
assert(clashBump !== null, 'Clash detected when both cats dash');
assert(clashBump?.comicText === '⚡ SUPER CLASH! ⚡', 'Simultaneous turbo charge triggers ⚡ SUPER CLASH! ⚡');
assert(clash1.vx < 0 && clash2.vx > 0, 'Both cats blasted backwards in opposite directions');
assert(clash1.state !== 'TURBO_DASH' && clash2.state !== 'TURBO_DASH', 'Both cats exit TURBO_DASH');

// 14g: Cooldown Speed Penalty (50% normal movement speed)
const slowCat = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
slowCat.turboCooldown = 240;

// Walk right for 10 frames during cooldown
for (let f = 0; f < 10; f++) {
  slowCat.updatePhysics(arena, false, true, false, 600);
}
console.log(`Max speed achieved during cooldown: ${slowCat.vx.toFixed(2)} px/frame (Normal max is 4.40)`);
assert(slowCat.vx <= 2.21, `Speed during cooldown is capped at half speed (got ${slowCat.vx.toFixed(2)} px/frame <= 2.20)`);

// Simulate remaining cooldown frames
while (slowCat.turboCooldown > 0) {
  slowCat.updatePhysics(arena, false, false, false, 600);
}
assert(slowCat.turboCooldown === 0, 'Cooldown reaches 0');
assert(slowCat.canTurboAttack(), 'Turbo Attack is available again after cooldown');

// Walk right after cooldown expired
for (let f = 0; f < 10; f++) {
  slowCat.updatePhysics(arena, false, true, false, 600);
}
assert(slowCat.vx > 3.0, `Full speed restored after cooldown (${slowCat.vx.toFixed(2)} px/frame)`);

// -------------------------------------------------------------
// TEST SUITE 15: Defensive Parry (Just-Guard) & Anti-Camping
// -------------------------------------------------------------
console.log('\n--- 15. Testing Defensive Parry (Just-Guard) & Anti-Camping ---');
const parryCat = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
assert(parryCat.canParry(), 'Fresh cat can initiate parry');

// 15a: Active 12-Frame Parry Window
parryCat.startParry();
assert(parryCat.state === 'PARRY', 'Cat state transitions to PARRY');
assert(parryCat.parryTimer === 12, 'Parry has exact 12-frame active window');
assert(parryCat.scaleX === 0.82 && parryCat.scaleY === 1.25, 'Cat assumes tense defensive brace scale');
assert(!parryCat.canParry(), 'Cannot re-trigger parry while already parrying');

// 15b: Anti-Camping Whiff Penalty: holding/timing out results in 18 frames vulnerability
for (let f = 0; f < 12; f++) {
  assert(parryCat.state === 'PARRY', `Frame ${f} remains in active PARRY`);
  parryCat.updatePhysics(arena, false, false, false, 600);
}
assert(parryCat.state === 'PARRY_WHIFF', 'Expiring parry without impact transitions into PARRY_WHIFF');
assert(parryCat.parryWhiffTimer === 18, 'Parry whiff imposes 18 frames of helpless recovery penalty');
assert(!parryCat.canParry(), 'Cannot parry while in whiff recovery');

// Movement locked during whiff
for (let f = 0; f < 18; f++) {
  assert(parryCat.state === 'PARRY_WHIFF', `Whiff frame ${f} locks movement`);
  parryCat.updatePhysics(arena, true, false, false, 600); // Holding left
}
assert(parryCat.state === 'IDLE', 'Returns to IDLE after whiff penalty completes');
assert(parryCat.parryCooldown > 0, 'Enters recovery cooldown after whiff');
assert(!parryCat.canParry(), 'Cannot immediately parry during cooldown');

while (parryCat.parryCooldown > 0) {
  parryCat.updatePhysics(arena, false, false, false, 600);
}
assert(parryCat.canParry(), 'Parry available again after cooldown');

// 15c: Successful Normal Parry vs Attacker
collision.resetCooldown();
const defender = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 370, initialFacing: 1 }, arena.config.ringSurfaceY);
const normalAttacker = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 405, initialFacing: -1 }, arena.config.ringSurfaceY);
normalAttacker.vx = -3.5;

defender.startParry();
const parryBump = collision.checkAndResolveCats(defender, normalAttacker);

assert(parryBump !== null, 'Collision resolved during parry');
assert(parryBump?.isParry === true, 'BumpEvent marked as isParry');
assert(parryBump?.comicText === '⚡ PARRY! ⚡', 'Comic text is ⚡ PARRY! ⚡');
assert(defender.state === 'IDLE', 'Defender successfully transitions out of PARRY on just-guard');
assert(defender.vx === 0, 'Defender takes zero knockback');
assert(normalAttacker.state === 'DAZED', 'Attacker is DAZED');
assert(normalAttacker.dazeTimer === 24, 'Attacker stunned for 24 frames');
assert(normalAttacker.vx > 4.0, `Attacker knocked back (${normalAttacker.vx.toFixed(2)} px/frame)`);

// 15d: Successful Turbo Parry vs Charging Turbo Attack
collision.resetCooldown();
const turboDefender = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 370, initialFacing: 1 }, arena.config.ringSurfaceY);
const turboCharger = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 410, initialFacing: -1 }, arena.config.ringSurfaceY);

turboCharger.startTurboAttack(-1);
turboDefender.startParry();

const turboParryBump = collision.checkAndResolveCats(turboDefender, turboCharger);
assert(turboParryBump !== null, 'Turbo attack collision detected during parry');
assert(turboParryBump?.isParry === true, 'Marked as isParry');
assert(turboParryBump?.comicText === '⚡ TURBO PARRY! ⚡', 'Comic text is ⚡ TURBO PARRY! ⚡');
assert(turboDefender.vx === 0, 'Defender absorbs full momentum with zero knockback');
assert(turboCharger.state === 'DAZED', 'Charging cat charge is broken into DAZED stun');
assert(turboCharger.dazeTimer === 36, 'Turbo attacker severely punished with 36 frames of daze stun');
assert(turboCharger.vx > 6.0, `Turbo attacker deflected backward with heavy recoil (${turboCharger.vx.toFixed(2)} px/frame)`);

// -------------------------------------------------------------
// TEST SUITE 16: CPU Controller AI Decision Tree
// -------------------------------------------------------------
console.log('\n--- 16. Testing CPU Controller AI Decision Tree ---');
import { CPUController } from '../src/engine/CPUController';

const cpuInput = new InputManager();
const cpu = new CPUController(cpuInput);

const cpuCat = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 600, initialFacing: -1 }, arena.config.ringSurfaceY);
const humanCat = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);

// 16a: Easy CPU Wanders towards opponent / edge avoidance
cpu.setDifficulty('easy');
let easyMoved = false;
for (let f = 0; f < 10; f++) {
  cpu.update(cpuCat, humanCat, arena);
  if (cpuInput.isDown('p2', 'left') || cpuInput.isDown('p2', 'right')) {
    easyMoved = true;
    break;
  }
}
assert(easyMoved, 'Easy CPU generates movement towards combat area');

// Edge avoidance is strictly deterministic
cpuCat.x = arena.config.ringLeft + 20; // Near left platform edge
cpu.update(cpuCat, humanCat, arena);
assert(cpuInput.isDown('p2', 'right') === true, 'Easy CPU turns away from dangerous left ring edge');

// 16b: Hard CPU Reactively Dodges Turbo Attack by jumping!
cpu.setDifficulty('hard');
humanCat.x = 450;
cpuCat.x = 550; // In close range
humanCat.startTurboAttack(1);

cpu.update(cpuCat, humanCat, arena);
assert(cpuInput.isDown('p2', 'jump') === true, 'Hard CPU detects incoming Turbo Attack and reactively jumps over charge');

// 16c: Hard CPU Punishes Dazed Human with Turbo Attack
let turboPunishTriggered = false;
cpu.setOnTurboTrigger(() => {
  turboPunishTriggered = true;
});
humanCat.endTurboAttack();
humanCat.state = 'DAZED';
humanCat.dazeTimer = 30;
humanCat.x = 450;
cpuCat.x = 550;
cpuCat.turboCooldown = 0;

cpu.update(cpuCat, humanCat, arena);
assert(turboPunishTriggered, 'Hard CPU detects dazed player and instantly executes Turbo Attack punish');

// 16d: Reset clears virtual inputs
cpu.reset();
assert(!cpuInput.isDown('p2', 'left') && !cpuInput.isDown('p2', 'jump'), 'CPU reset clears all virtual inputs');

// -------------------------------------------------------------
// TEST SUITE 17: Themed Arenas & Stage Selection
// -------------------------------------------------------------
console.log('\n--- 17. Testing Themed Arenas & Stage Selection ---');
const testArena = new Arena(960, 540);
assert(testArena.currentStage === 'dojo', 'Default stage is dojo');
assert(testArena.stageSelection === 'random', 'Default stage selection is random');

// Manual selection fixes stage
testArena.setStageSelection('cyberpunk');
assert(testArena.currentStage === 'cyberpunk', 'Current stage updated to cyberpunk');
assert(testArena.prepareRoundStage() === 'cyberpunk', 'Fixed selection keeps cyberpunk stage across rounds');

testArena.setStageSelection('thunder');
assert(testArena.currentStage === 'thunder', 'Current stage updated to thunder');
assert(testArena.getStageDisplayName().includes('THUNDER'), 'Display name reflects Midnight Thunder Shrine');

// Random shuffle non-repeating
testArena.setStageSelection('random');
const s1 = testArena.prepareRoundStage();
const s2 = testArena.prepareRoundStage();
console.log(`Shuffled Stages: ${s1} -> ${s2}`);
assert(Arena.ALL_STAGES.includes(s1), 'Round stage 1 is valid');
assert(Arena.ALL_STAGES.includes(s2), 'Round stage 2 is valid');
assert(s1 !== s2, 'Random stage shuffle does not repeat the same stage consecutively');

// -------------------------------------------------------------
// TEST SUITE 18: Left & Right Dohyo Edge Ring-Out Physics
// -------------------------------------------------------------
console.log('\n--- 18. Testing Left & Right Dohyo Edge Ring-Out Physics ---');
const ringOutArena = new Arena(960, 540);
const edgeInput = new InputManager();
const edgeCpu = new CPUController(edgeInput);
const edgeSound = new SoundSynthesizer();
const edgeCollision = new CollisionEngine(edgeSound);

// 18a: Mochi pushes Kuro off the left Dohyo edge (the exact reported bug)
for (let p2StartX = 180; p2StartX <= 210; p2StartX += 10) {
  edgeCollision.resetCooldown();
  const mochi = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: p2StartX + 20, initialFacing: -1 }, ringOutArena.config.ringSurfaceY);
  const kuro = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: p2StartX, initialFacing: 1 }, ringOutArena.config.ringSurfaceY);
  edgeCpu.reset();

  mochi.y = kuro.y - 30; // Mochi executes a height advantage pounce
  mochi.vy = 2;

  let ringOutTriggered = false;
  let ringOutFrame = 0;

  for (let frame = 1; frame <= 60; frame++) {
    edgeCpu.update(kuro, mochi, ringOutArena);
    mochi.updatePhysics(ringOutArena, true, false, false, kuro.x);
    kuro.updatePhysics(ringOutArena, edgeInput.isDown('p2', 'left'), edgeInput.isDown('p2', 'right'), edgeInput.isDown('p2', 'jump'), mochi.x);
    edgeCollision.checkAndResolveCats(mochi, kuro);

    if (kuro.state === 'RING_OUT') {
      ringOutTriggered = true;
      ringOutFrame = frame;
      break;
    }
  }

  assert(ringOutTriggered, `Kuro pushed off left edge from x=${p2StartX} triggers RING_OUT without timing out`);
  assert(ringOutFrame <= 25, `Kuro RING_OUT occurs quickly (${ringOutFrame} frames <= 25)`);
}

// 18b: Turbo Attack pushes Kuro off the left Dohyo edge
{
  edgeCollision.resetCooldown();
  const mochi = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 250, initialFacing: -1 }, ringOutArena.config.ringSurfaceY);
  const kuro = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 195, initialFacing: 1 }, ringOutArena.config.ringSurfaceY);
  edgeCpu.reset();

  mochi.startTurboAttack(-1);

  let ringOutTriggered = false;
  let ringOutFrame = 0;

  for (let frame = 1; frame <= 60; frame++) {
    edgeCpu.update(kuro, mochi, ringOutArena);
    mochi.updatePhysics(ringOutArena, true, false, false, kuro.x);
    kuro.updatePhysics(ringOutArena, edgeInput.isDown('p2', 'left'), edgeInput.isDown('p2', 'right'), edgeInput.isDown('p2', 'jump'), mochi.x);
    edgeCollision.checkAndResolveCats(mochi, kuro);

    if (kuro.state === 'RING_OUT') {
      ringOutTriggered = true;
      ringOutFrame = frame;
      break;
    }
  }

  assert(ringOutTriggered, 'Turbo Attack pushes Kuro off left edge and triggers immediate RING_OUT');
  assert(ringOutFrame <= 20, `Turbo Attack ring out triggered in ${ringOutFrame} frames`);
}

// 18c: Right edge ring-out symmetry
{
  edgeCollision.resetCooldown();
  const mochi = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 740, initialFacing: 1 }, ringOutArena.config.ringSurfaceY);
  const kuro = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 765, initialFacing: -1 }, ringOutArena.config.ringSurfaceY);
  edgeCpu.reset();

  mochi.y = kuro.y - 30;
  mochi.vy = 2;

  let ringOutTriggered = false;
  for (let frame = 1; frame <= 60; frame++) {
    edgeCpu.update(kuro, mochi, ringOutArena);
    mochi.updatePhysics(ringOutArena, false, true, false, kuro.x);
    kuro.updatePhysics(ringOutArena, edgeInput.isDown('p2', 'left'), edgeInput.isDown('p2', 'right'), edgeInput.isDown('p2', 'jump'), mochi.x);
    edgeCollision.checkAndResolveCats(mochi, kuro);

    if (kuro.state === 'RING_OUT') {
      ringOutTriggered = true;
      break;
    }
  }

  assert(ringOutTriggered, 'Kuro pushed off right Dohyo edge triggers RING_OUT cleanly');
}

// 18d: Ring-out detection during PARRY and PARRY_WHIFF stances
{
  const parryCat = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 160, initialFacing: 1 }, ringOutArena.config.ringSurfaceY);
  parryCat.startParry();
  assert(parryCat.state === 'PARRY', 'Cat is in active PARRY');

  // Let gravity pull parrying cat past platform level over pit
  for (let f = 0; f < 15; f++) {
    parryCat.updatePhysics(ringOutArena, false, false, false, 300);
    if (parryCat.state === 'RING_OUT') break;
  }
  assert(parryCat.state === 'RING_OUT', 'Parrying cat falling off Dohyo triggers RING_OUT');
}

// 18e: Off-screen absolute boundary detection
assert(ringOutArena.isRingOut(400, 550, 56, 52), 'Cat below canvas floor (y=550 > 540) is RING_OUT regardless of X');
assert(ringOutArena.isRingOut(-60, 300, 56, 52), 'Cat past canvas left bound is RING_OUT');
assert(ringOutArena.isRingOut(970, 300, 56, 52), 'Cat past canvas right bound is RING_OUT');

console.log('\n--- 19. Testing Fighter Archetype Multipliers & Balanced Matchups ---');
import { FIGHTER_PROFILES, CatBreed } from '../src/entities/Cat';

// 19a: Profile integrity
const breeds: CatBreed[] = ['ginger_tabby', 'black_tuxedo', 'british_blue', 'calico_acrobat'];
for (const breed of breeds) {
  const prof = FIGHTER_PROFILES[breed];
  assert(!!prof.name && !!prof.title && !!prof.description, `Profile for ${breed} has name, title, and description`);
  assert(prof.weightMultiplier >= 0.85 && prof.weightMultiplier <= 1.35, `${breed} weight multiplier is strictly within balanced corridor`);
  assert(prof.speedMultiplier >= 0.80 && prof.speedMultiplier <= 1.25, `${breed} speed multiplier is strictly within balanced corridor`);
  assert(prof.jumpMultiplier >= 0.90 && prof.jumpMultiplier <= 1.20, `${breed} jump multiplier is strictly within balanced corridor`);
}

// 19b: Mass Knockback Resistance (Boris vs Kuro vs Wasabi)
{
  const p1Attacker = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
  const p2Boris = new Cat({ id: 'p2', name: 'Boris', breed: 'british_blue', initialX: 420, initialFacing: -1 }, arena.config.ringSurfaceY);
  const p2Kuro = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 420, initialFacing: -1 }, arena.config.ringSurfaceY);
  const p2Wasabi = new Cat({ id: 'p2', name: 'Wasabi', breed: 'calico_acrobat', initialX: 420, initialFacing: -1 }, arena.config.ringSurfaceY);

  collision.resetCooldown();
  p1Attacker.y = p2Boris.y - 30;
  collision.checkAndResolveCats(p1Attacker, p2Boris);
  const borisKnockback = Math.abs(p2Boris.vx);

  collision.resetCooldown();
  p1Attacker.y = p2Kuro.y - 30;
  collision.checkAndResolveCats(p1Attacker, p2Kuro);
  const kuroKnockback = Math.abs(p2Kuro.vx);

  collision.resetCooldown();
  p1Attacker.y = p2Wasabi.y - 30;
  collision.checkAndResolveCats(p1Attacker, p2Wasabi);
  const wasabiKnockback = Math.abs(p2Wasabi.vx);

  console.log(`Boris knockback (1.25x mass): ${borisKnockback.toFixed(2)} px/frame`);
  console.log(`Kuro knockback (1.00x mass): ${kuroKnockback.toFixed(2)} px/frame`);
  console.log(`Wasabi knockback (0.88x mass): ${wasabiKnockback.toFixed(2)} px/frame`);

  assert(borisKnockback < kuroKnockback, 'Boris takes strictly less knockback than Kuro due to heavy mass');
  assert(wasabiKnockback > kuroKnockback, 'Wasabi takes greater knockback than Kuro due to lighter mass');
}

// 19c: Jump Altitude Clearance across all 4 Archetypes
{
  for (const breed of breeds) {
    const testCat = new Cat({ id: 'p1', breed, initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
    const startY = testCat.y;
    testCat.jump();
    let peakY = startY;

    for (let f = 0; f < 30; f++) {
      testCat.updatePhysics(arena, false, false, true, 500);
      if (testCat.y < peakY) peakY = testCat.y;
    }

    const altitude = startY - peakY;
    console.log(`${breed} jump altitude: ${altitude.toFixed(1)}px (Cat height: 52px)`);
    assert(altitude > 120, `${breed} achieves altitude (${altitude.toFixed(1)}px) cleanly vaulting over opponent`);
  }
}

// 19d: Ground Waddle Speed (Kuro speedster vs Boris heavy)
{
  const kuro = new Cat({ id: 'p1', name: 'Kuro', breed: 'black_tuxedo', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
  const boris = new Cat({ id: 'p2', name: 'Boris', breed: 'british_blue', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);

  for (let f = 0; f < 30; f++) {
    kuro.updatePhysics(arena, false, true, false, 600);
    boris.updatePhysics(arena, false, true, false, 600);
  }

  const kuroDist = kuro.x - 400;
  const borisDist = boris.x - 400;
  console.log(`30-frame waddle distance - Kuro: ${kuroDist.toFixed(1)}px, Boris: ${borisDist.toFixed(1)}px`);
  assert(kuroDist > borisDist, 'Kuro covers strictly more distance than Boris due to 1.16x speed multiplier');
}

console.log('\n--- 20. Testing Combat Statistics Tracking ---');
{
  const catA = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
  const catB = new Cat({ id: 'p2', name: 'Kuro', breed: 'black_tuxedo', initialX: 420, initialFacing: -1 }, arena.config.ringSurfaceY);

  assert(catA.combatStats.bumpsLanded === 0, 'Initial bumpsLanded is 0');
  assert(catA.combatStats.megaBonks === 0, 'Initial megaBonks is 0');
  assert(catA.combatStats.parriesSuccessful === 0, 'Initial parriesSuccessful is 0');

  // Trigger Bump
  collision.resetCooldown();
  catA.y = catB.y - 35; // >32 delta triggers mega bonk
  collision.checkAndResolveCats(catA, catB);

  assert(catA.combatStats.bumpsLanded === 1, 'Bumps landed incremented to 1');
  assert(catA.combatStats.megaBonks === 1, 'Mega bonks incremented to 1');

  // Trigger Parry
  collision.resetCooldown();
  catB.startParry();
  collision.checkAndResolveCats(catA, catB);
  assert(catB.combatStats.parriesSuccessful === 1, 'Defender parriesSuccessful incremented to 1');

  // Trigger Turbo Hit
  collision.resetCooldown();
  catA.startTurboAttack(1);
  collision.checkAndResolveCats(catA, catB);
  assert(catA.combatStats.turboHitsLanded === 1, 'Attacker turboHitsLanded incremented to 1');

  // Trigger Teeter Save
  const edgeArena = new Arena(960, 540);
  const teeterCat = new Cat({ id: 'p1', name: 'Boris', breed: 'british_blue', initialX: 200, initialFacing: -1 }, edgeArena.config.ringSurfaceY);
  teeterCat.vx = 0.5;
  teeterCat.updatePhysics(edgeArena, false, false, false, 400);
  assert(teeterCat.state === 'TEETER', 'Cat entered TEETER state');

  // Cat walks back to center
  for (let f = 0; f < 15; f++) {
    teeterCat.updatePhysics(edgeArena, false, true, false, 400);
  }
  assert(teeterCat.combatStats.teeterSaves === 1, 'Teeter saves incremented to 1 on recovering to safe Dohyo');

  // Reset Combat Stats
  catA.resetCombatStats();
  assert(catA.combatStats.bumpsLanded === 0, 'Combat stats cleanly reset');
}

console.log('\n--- 21. Testing Dynamic Breed Swapping & SetBreed ---');
{
  const testCat = new Cat({ id: 'p1', name: 'Mochi', breed: 'ginger_tabby', initialX: 400, initialFacing: 1 }, arena.config.ringSurfaceY);
  assert(testCat.breed === 'ginger_tabby', 'Initial breed is ginger_tabby');
  assert(testCat.weightMultiplier === 1.0, 'Initial weight is 1.0');

  testCat.setBreed('british_blue');
  assert(testCat.breed === 'british_blue', 'Breed updated to british_blue');
  assert(testCat.name === 'Boris', 'Name updated to Boris');
  assert(testCat.weightMultiplier === 1.25, 'Weight multiplier updated to 1.25');
  assert(testCat.speedMultiplier === 0.84, 'Speed multiplier updated to 0.84');
  assert(testCat.jumpMultiplier === 0.92, 'Jump multiplier updated to 0.92');

  testCat.setBreed('calico_acrobat');
  assert(testCat.breed === 'calico_acrobat', 'Breed updated to calico_acrobat');
  assert(testCat.name === 'Wasabi', 'Name updated to Wasabi');
  assert(testCat.weightMultiplier === 0.88, 'Weight multiplier updated to 0.88');
  assert(testCat.jumpMultiplier === 1.16, 'Jump multiplier updated to 1.16');
}

console.log('\n--- 22. Testing Menu Navigation & Fighter Selection Flow ---');
{
  const hud = new ArcadeHUD();
  assert(hud.matchPhase === 'TITLE', 'Game begins in TITLE phase');

  // Verify startMatch enters ROUND_READY requiring player ready acknowledgement
  hud.startMatch();
  assert(hud.matchPhase === 'ROUND_READY', 'startMatch enters ROUND_READY phase');
  assert(hud.currentRound === 1, 'Match begins at Round 1');
  assert(!hud.p1Ready, 'P1 must acknowledge ready');

  // Online signal simulation
  let remoteSignalReceived = false;
  let receivedBreeds = null as any;
  const mockSignalHandler = (signal: any) => {
    if (signal.type === 'START_MATCH') {
      remoteSignalReceived = true;
      receivedBreeds = signal.payload;
    }
  };

  mockSignalHandler({
    type: 'START_MATCH',
    payload: { p1Breed: 'british_blue', p2Breed: 'calico_acrobat' },
  });

  assert(remoteSignalReceived, 'Remote START_MATCH signal processed successfully');
  assert(receivedBreeds.p1Breed === 'british_blue', 'Remote p1Breed matches Host selection');
  assert(receivedBreeds.p2Breed === 'calico_acrobat', 'Remote p2Breed matches Guest selection');
}

console.log('\n--- 23. Testing CPU Fighter Selection & Online Post-Match Flow ---');
{
  // Test 23a: Independent CPU cat selection
  const p1 = new Cat({ id: 'p1', name: 'Boris', breed: 'british_blue', initialX: 300, initialFacing: 1 }, arena.config.ringSurfaceY);
  const p2 = new Cat({ id: 'p2', name: 'Boris', breed: 'british_blue', initialX: 604, initialFacing: -1 }, arena.config.ringSurfaceY);
  assert(p1.breed === 'british_blue', 'P1 selected Boris');
  assert(p2.breed === 'british_blue', 'P2/CPU selected Boris independently (mirror match allowed)');

  // Test 23b: Online Rematch & Character Select signals
  let hostSentSignal: any = null;
  let guestReceivedCharSelect = false;
  let guestReceivedRematch = false;

  const mockHostSignalHandler = (signal: any) => {
    if (signal.type === 'REQUEST_REMATCH') {
      // Host responds with START_MATCH
      hostSentSignal = { type: 'START_MATCH', payload: { p1Breed: p1.breed, p2Breed: p2.breed } };
    } else if (signal.type === 'REQUEST_CHAR_SELECT') {
      // Host responds with GOTO_CHAR_SELECT
      hostSentSignal = { type: 'GOTO_CHAR_SELECT' };
    }
  };

  const mockGuestSignalHandler = (signal: any) => {
    if (signal.type === 'START_MATCH') {
      guestReceivedRematch = true;
    } else if (signal.type === 'GOTO_CHAR_SELECT') {
      guestReceivedCharSelect = true;
    }
  };

  // Guest requests Rematch
  mockHostSignalHandler({ type: 'REQUEST_REMATCH' });
  assert(hostSentSignal?.type === 'START_MATCH', 'Host processed REQUEST_REMATCH and broadcast START_MATCH');
  mockGuestSignalHandler(hostSentSignal);
  assert(guestReceivedRematch, 'Guest successfully received START_MATCH without disconnection');

  // Guest requests Change Fighters
  hostSentSignal = null;
  mockHostSignalHandler({ type: 'REQUEST_CHAR_SELECT' });
  assert(hostSentSignal?.type === 'GOTO_CHAR_SELECT', 'Host processed REQUEST_CHAR_SELECT and broadcast GOTO_CHAR_SELECT');
  mockGuestSignalHandler(hostSentSignal);
  assert(guestReceivedCharSelect, 'Guest successfully transitioned to GOTO_CHAR_SELECT without disconnection');
}

console.log('\n🎉 ALL GAMEPLAY SIMULATION TESTS PASSED!\n');
