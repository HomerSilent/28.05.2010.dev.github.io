export async function onRequestGet({ env }) {
    const query = `{
        a: repository(owner: "suon2805", name: "28.05.2010.github.io") { stargazers { totalCount } forks { totalCount } }
    }`;

    const { data } = await (await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'authorization': `bearer ${env.GITHUB_TOKEN}`,
            'user-agent': 'AutumnVN'
        },
        body: JSON.stringify({ query }),
        cf: {
            cacheTtl: 3600,
            cacheEverything: true
        }
    })).json();

    const arr = Object.values(data);
    const res = [];
    for (let i = 0; i < arr.length; i++) {
        res.push({
            star: arr[i].stargazers.totalCount,
            fork: arr[i].forks.totalCount
        });
    }

    return new Response(JSON.stringify(res), {
        headers: {
            'content-type': 'application/json',
            'cache-control': 'public, max-age=3600'
        }
    });
}
