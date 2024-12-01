const os = require('node:os');

const nameMap = new Map([
	[24, ['Sequoia', '15']],
	[23, ['Sonoma', '14']],
	[22, ['Ventura', '13']],
	[21, ['Monterey', '12']],
	[20, ['Big Sur', '11']],
	[19, ['Catalina', '10.15']],
	[18, ['Mojave', '10.14']],
	[17, ['High Sierra', '10.13']],
	[16, ['Sierra', '10.12']],
	[15, ['El Capitan', '10.11']],
	[14, ['Yosemite', '10.10']],
	[13, ['Mavericks', '10.9']],
	[12, ['Mountain Lion', '10.8']],
	[11, ['Lion', '10.7']],
	[10, ['Snow Leopard', '10.6']],
	[9, ['Leopard', '10.5']],
	[8, ['Tiger', '10.4']],
	[7, ['Panther', '10.3']],
	[6, ['Jaguar', '10.2']],
	[5, ['Puma', '10.1']],
]);

const names = new Map([
	['10.0.2', '11'], // It's unclear whether future Windows 11 versions will use this version scheme: https://github.com/sindresorhus/windows-release/pull/26/files#r744945281
	['10.0', '10'],
	['6.3', '8.1'],
	['6.2', '8'],
	['6.1', '7'],
	['6.0', 'Vista'],
	['5.2', 'Server 2003'],
	['5.1', 'XP'],
	['5.0', '2000'],
	['4.90', 'ME'],
	['4.10', '98'],
	['4.03', '95'],
	['4.00', '95'],
]);

function macosRelease(release) {
	release = Number((release || os.release()).split('.')[0]);

	const [name, version] = nameMap.get(release) || ['Unknown', ''];

	return {
		name,
		version,
	};
}

function windowsRelease(release) {
	const version = /(\d+\.\d+)(?:\.(\d+))?/.exec(release || os.release());

	if (release && !version) {
		throw new Error('`release` argument doesn\'t match `n.n`');
	}

	let ver = version[1] || '';
	const build = version[2] || '';

	if (ver === '10.0' && build.startsWith('2')) {
		ver = '10.0.2';
	}

	return names.get(ver);
}

function osName(platform, release) {
	if (!platform && release) {
		throw new Error('You can\'t specify a `release` without specifying `platform`');
	}

	platform = platform ?? os.platform();

	let id;

	if (platform === 'darwin') {
		if (!release && os.platform() === 'darwin') {
			release = os.release();
		}

		const prefix = release ? (Number(release.split('.')[0]) > 15 ? 'macOS' : 'OS X') : 'macOS';

		try {
			id = release ? macosRelease(release).name : '';

			if (id === 'Unknown') {
				return prefix;
			}
		} catch {}

		return prefix + (id ? ' ' + id : '');
	}

	if (platform === 'linux') {
		if (!release && os.platform() === 'linux') {
			release = os.release();
		}

		id = release ? release.replace(/^(\d+\.\d+).*/, '$1') : '';
		return 'Linux' + (id ? ' ' + id : '');
	}

	if (platform === 'win32') {
		if (!release && os.platform() === 'win32') {
			release = os.release();
		}

		id = release ? windowsRelease(release) : '';
		return 'Windows' + (id ? ' ' + id : '');
	}

	return platform;
}

module.exports = osName;
