document.querySelector('down-arrow').addEventListener('click', () => {
    const start = performance.now();
    !function step() {
        const progress = (performance.now() - start) / 200;
        const amount = (p => --p * p * p + 1)(progress);
        scrollTo({ top: .3 * innerHeight * amount });
        if (progress < 1) requestAnimationFrame(step);
    }();
});

(window.setScrollValue = () => document.body.style.setProperty('--scroll', scrollY / innerHeight))();
addEventListener('scroll', setScrollValue);
addEventListener('resize', setScrollValue);

addEventListener('mousemove', ({ clientX, clientY }) => {
    document.querySelector('#background').style.setProperty('--tx', `${20 * (clientX - innerWidth / 2) / innerWidth}px`);
    document.querySelector('#background').style.setProperty('--ty', `${20 * (clientY - innerHeight / 2) / innerHeight}px`);
});
document.addEventListener('mouseleave', () => document.querySelector('#background').removeAttribute('style'));
addEventListener('touchstart', () => document.body.classList.add('touch-device'), { once: true });

(window.setSquareSizeAndGap = () => {
    const bento = document.querySelector('bento-grid');
    const columns = getComputedStyle(bento).gridTemplateColumns.split(' ').length;
    const gap = parseInt(getComputedStyle(bento).columnGap);
    const squareSize = (bento.offsetWidth - gap * (columns - 1)) / columns;
    bento.style.setProperty('--square-size', `${squareSize}px`);
    bento.style.setProperty('--gap', `${gap}px`);
})();
addEventListener('resize', setSquareSizeAndGap);

const visit = new Date(new Date().setSeconds(0, 0)).getTime();
const prev = {};
!function setClock() {
    const date = new Date();
    const time = date.getTime();
    const { year, month, day, hour, minute, second } = (() => {
        const obj = {};
        new Intl.DateTimeFormat([], {
            timeZone: 'Asia/Ho_Chi_Minh', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false, day: 'numeric', month: 'numeric', year: 'numeric'
        }).formatToParts(new Date()).forEach(({ type, value }) => obj[type] = parseInt(value));
        return obj;
    })();
    const hourOff = -date.getTimezoneOffset() / 60;
    const minuteOff = new Date(time - time % 1000 - hourOff * 60 * 60 * 1000);
    const tzOff = (new Date(year, month - 1, day, hour, minute, second) - minuteOff) / 1000 / 60 / 60;
    const tzDiff = tzOff - hourOff;
    update('hour-hand', `rotate(${hour % 12 / 12 * 360 + minute / 60 * 30 + second / 60 / 60 * 30}deg)`);
    update('minute-hand', `rotate(${minute / 60 * 360 + second / 60 * 6}deg)`);
    update('second-hand', `rotate(${360 * Math.floor((time - visit) / 60 / 1000) + second / 60 * 360}deg)`);
    update('#date', new Date(time + tzDiff * 60 * 60 * 1000).toLocaleDateString());
    update('#hour', hour.toString().padStart(2, '0'));
    update('#minute', minute.toString().padStart(2, '0'));
    update('#second', second.toString().padStart(2, '0'));
    update('#timezone-diff', tzDiff === 0 ? 'same time' : (tzDiff > 0 ? `${format(tzDiff)} ahead` : `${format(-tzDiff)} behind`));
    update('#utc-offset', ` / UTC ${(tzOff >= 0 ? '+' : '')}${Math.floor(tzOff)}:${(tzOff % 1 * 60).toString().padStart(2, '0')}`);
    setTimeout(setClock, 1000 - time % 1000);
    function format(tzDiff) {
        if (tzDiff < 0) return `-${format(-tzDiff)}`;
        const minute = tzDiff % 1 * 60;
        tzDiff = Math.floor(tzDiff);
        return minute ? `${tzDiff}h ${minute}m` : `${tzDiff}h`;
    }
}();

function update(selector, value) {
    value = value || '';
    if (prev[selector] === value) return;
    const e = document.querySelector(selector);
    if (value.startsWith('rotate')) e.style.transform = value;
    else if (value.match(/^#[a-f0-9]+$/)) e.style.backgroundColor = value;
    else if (value.startsWith('--bg')) e.style.setProperty(value.split(':')[0], value.split(' ')[1]);
    else if (value === '' && selector.includes('-image')) e.removeAttribute('style');
    else e.textContent = value;
    prev[selector] = value;
}

!async function () {
    const data = await (await fetch('/repo')).json();
    document.querySelectorAll('project-star span').forEach((repo, i) => repo.textContent = data[i].star);
    document.querySelectorAll('project-fork span').forEach((repo, i) => repo.textContent = data[i].fork);
}();

!function lanyard() {
    const ActivityType = ['Playing', 'Streaming to', 'Listening to', 'Watching', 'Custom status', 'Competing in'];
    const StatusColor = { online: '#4b8', idle: '#fa1', dnd: '#f44', offline: '#778' };
    const ws = new WebSocket('wss://api.lanyard.rest/socket');
    ws.addEventListener('open', () => ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: '1090598181219336222' } })));
    ws.addEventListener('error', () => ws.close());
    ws.addEventListener('close', () => setTimeout(lanyard, 1000));
    ws.addEventListener('message', async ({ data }) => {
        const { t, d } = JSON.parse(data);
        if (t !== 'INIT_STATE' && t !== 'PRESENCE_UPDATE') return;
        update('status-dot', StatusColor[d.discord_status]);
        const activities = d.activities.filter(a => a.type !== 3 && a.type !== 4);
        if (!activities.length || d.discord_status === 'offline') {
            update('.status', d.discord_status);
            update('big-image');
            update('small-image');
            update('.activity');
            update('.details');
            update('.state');
            return setRpcTimestamp();
        }
        const a = activities[0];
        update('big-image', !a.assets?.large_image ? '' : a.assets.large_image.startsWith('mp:') ? `--bg: url(https://media.discordapp.net/${a.assets.large_image.slice(3)}?width=144&height=144)` : `--bg: url(https://cdn.discordapp.com/app-assets/${a.application_id}/${a.assets.large_image}.png?size=128)`);
        update('small-image', !a.assets?.small_image ? '' : a.assets.small_image.startsWith('mp:') ? `--bg: url(https://media.discordapp.net/${a.assets.small_image.slice(3)}?width=60&height=60)` : `--bg: url(https://cdn.discordapp.com/app-assets/${a.application_id}/${a.assets.small_image}.png?size=60)`);
        update('.status', ActivityType[a.type]);
        update('.activity', a.name);
        update('.details', a.details);
        update('.state', a.state);
        setRpcTimestamp(prev.timestamp = a.timestamps?.end ? a.timestamps.end : a.timestamps?.start);
    });
}();

function setRpcTimestamp(timestamp) {
    if (!timestamp) {
        update('.timestamp');
        return delete prev.timestamp;
    }
    const diff = Math.abs(timestamp - Date.now());
    const hour = Math.floor(diff / 1000 / 60 / 60);
    const minute = Math.floor(diff / 1000 / 60) % 60;
    const second = Math.floor(diff / 1000) % 60;
    update('.timestamp', `${hour ? `${hour.toString().padStart(2, '0')}:` : ''}${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')} ${timestamp > Date.now() ? 'left' : 'elapsed'}`);
}

!function r() {
    setRpcTimestamp(prev.timestamp);
    setTimeout(r, 1000 - Date.now() % 1000);
}();
