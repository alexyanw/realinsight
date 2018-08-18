function update_chart(estimation, transactions) {
/*
  var series = estimation.map(function(d){return d.estimation;});
  var interpolate = d3.interpolateBasis(series);
  var estimates_interpolated = estimation.map(function(d, i){
    return {date: d.date, estimation: interpolate(i/series.length)};
	});
*/
  var estimates_interpolated = estimation;
  var options = {
		point: { show: false, r: 5 }
	};
  var chart = draw_line_chart('#chart-estimation', estimates_interpolated, 'date', ['estimation', 'sold_price'], '', options);
  chart.load({
      json: transactions,
      keys: { x: 'date', value: ['sold_price'] },
      types: {sold_price: 'scatter'},
  });

  return chart;
}


