const COUNT_KEY = 'Количество преступлений, зарегистрированных в отчетном периоде';

function convertThousandtoString(value) {
	if (value.toString().length > 3)
		return (value / 1000) + ' тыс';
	return value;
}

function getMinLegend(legend_length, value) {
	let digit = value.toString().length;
	let divider = digit > 2 ? Math.pow(10, digit - 2) : 1;
	return Math.floor(value / (legend_length * divider)) * divider;
}

function getRegionCrimeCount(statistics, name) {
	let result = statistics.find(e => e[0] === name && e[2] === COUNT_KEY);
	if (typeof result === 'undefined')
		return 0;
	return parseInt(result[3]);
}

function getRegionStatistic(statistics, name) {
	return statistics.filter(e => e[0] === name);
}

function getCountColor(count, counts_color) {
	let key, value = "#d4f2f4";
	for ([key, value] of counts_color) {
		if (count < key)
			return value;
	}
	return value;
}

function loadData() {
	$.ajax({
		type: "GET",
		url: "data-20221212-structure-20210726.csv",
		dataType: "text",
		success: function (response) {
			data = $.csv.toArrays(response);
			if (data.length == 0)
				alert('Данные не найдены!');
			else {
				loadLegend(data);
			}
		}
	});
}

function loadLegend(data) {
	let counts_color = new Map();
	const legendItems = document.querySelectorAll('.legend tr');
	const mapPaths = document.querySelectorAll('.map path');
	let titles = [];
	mapPaths.forEach(el => {
		titles.push(el.getAttribute('title'));

	});
	let statistics = data.filter(line => titles.includes(line[0]));

	titles.forEach(el => {
		let result = statistics.find(e => e[0] === el);
		//console.log(el + ' not found');
		if (typeof result === 'undefined')
			console.log(el + ' not found');
	});

	let cur_count = max_count = 0;
	statistics.filter(i => i[2] === COUNT_KEY).forEach(j => {
		//console.log(j);
		cur_count = parseInt(j[3])
		if (max_count < cur_count)
			max_count = cur_count;
	});

	let cur_legend = min_legend = getMinLegend(legendItems.length, max_count);
	legendItems.forEach((el, index) => {
		counts_color.set(cur_legend, el.firstElementChild.style.backgroundColor);
		//let text = convertThousandtoString(cur_legend);
		let regionHTML = el.innerHTML.replace('{{count}}', convertThousandtoString(cur_legend));
		if (index > 0 && index < (legendItems.length - 1)) {
			cur_legend += min_legend
		}
		regionHTML = regionHTML.replace('- {{count}}', ' - ' + convertThousandtoString(cur_legend));
		el.innerHTML = regionHTML;
		el.style.visibility = "visible";

	});

	loadMap(mapPaths, statistics, counts_color);
}

function loadMap(mapPaths, statistics, counts_color) {
	let region = document.querySelector('.region');
	let regionHTMLTemplate = region.innerHTML;
	mapPaths.forEach(el => {
		let title = el.getAttribute('title');
		let count = getRegionCrimeCount(statistics, title);
		let color = getCountColor(count, counts_color);	
		el.style.cssText = `fill: ${color};`
		//console.log(color);

		el.addEventListener('mouseenter', (e) => {
			e.currentTarget.style.cssText = `fill: #E8E868;`
			let regionHTML = regionHTMLTemplate.replace('{{Регион}}', title).replace('{{x}}', count);
			region.innerHTML = regionHTML;
			region.style.visibility = "visible";
		});

		el.addEventListener('mouseleave', (e) => {
			e.currentTarget.style.cssText = `fill: ${color};`;
			let region = document.querySelector('.region');
			region.style.visibility = "hidden";
		});
		el.addEventListener('click', (e) => {
			e.preventDefault();
			let statistic = getRegionStatistic(statistics, title);
			//console.log(statistic);
			if (statistic.length > 0) {
				let a = '<table id="painting" cellspacing="2" border="0" cellpadding="5">';
				statistic.forEach(element => a += `<tr><td align="right"><b>${element[3]}</b></td><td align="left">${element[2]}</td></tr>`);
				a += '</table>';
				let modal = $modal();
				modal.setTitle(title);
				modal.setContent(a);;
				modal.show();
			}
		});
	});
}

loadData();