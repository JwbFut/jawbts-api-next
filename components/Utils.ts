export async function getPos(ip: string) {
    const response = await fetch(`https://ipinfo.io/${ip}`, { headers: { 'Accept': 'application/json' } });
    return await response.json();
}