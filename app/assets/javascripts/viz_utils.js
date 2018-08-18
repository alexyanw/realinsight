function draw_line_chart(docid, json_array, x, columns, format='', options={}) {
  var axis_format = 
  {
			y: {
				tick: {format: function(d) {
					if(format=='ratio'){
						return (d*100).toFixed(1).toString() + '%'; 
					}else{
						return d;
					}
				}}
			}
	};
  if(x == 'date') {
		axis_format['x'] = {
				type: 'timeseries',
				tick: {
						format: '%Y-%m'
				}
		};
	}
  var config = {
    bindto: docid,
    data: {
      json: json_array,
      keys: {
        x: x,
        value: columns,
      },
    },
    axis: axis_format,
  };

  var chart = c3.generate(Object.assign({}, config, options));
  return chart;
}

function draw_line_chart_zip(docid, json_arrays, x, columns, format='') {
  var chart;
  for(var zip in json_arrays) {
    var json_array = json_arrays[zip];
    var new_columns = [];
    if(zip == '') {zip = 'county'};
    for(var i in columns) {
      column = columns[i];
      zip_col = (columns.length==1) ? zip : zip + '_' + column;
      new_columns.push(zip_col);
      for(var j in json_array) {
        json_array[j][zip_col] = json_array[j][column];
      }
    }
    if(chart == undefined) {
      chart = draw_line_chart(docid, json_array, x, new_columns, format);
    }else{
      chart.load({
          json: json_array,
          keys: {
            x: x,
            value: new_columns,
          },
      });
    }
  }
  return chart;
}

function draw_line_bar_chart(docid, json_arrays, x, line_columns, bar_columns) {
  var cm_cat20 = d3.scale.category20();
  var chart;
  var bar_groups = [];
  for(var i in bar_columns) {
    bar_groups.push([]);
  }
  var legend_names = {};
  var colors = {};
  var index = 0;
  for(var zip in json_arrays) {
    index += 1;
    var json_array = json_arrays[zip];
    var new_line_columns = [];
    var new_bar_columns = [];

    var col_types = {};
    var col_axes = {};
    if(zip == '') {zip = 'county'};
    for(var i in line_columns) {
      column = line_columns[i];
      zip_col = zip + '_' + column;
      new_line_columns.push(zip_col);
      for(var j in json_array) {
        json_array[j][zip_col] = json_array[j][column];
      }

      col_types[zip_col] = 'line';
      col_axes[zip_col] = 'y';
    }
    for(var i in bar_columns) {
      column = bar_columns[i];
      zip_col = zip + '_' + column;
      new_bar_columns.push(zip_col);
      bar_groups[i].push(zip_col);
      for(var j in json_array) {
        json_array[j][zip_col] = json_array[j][column];
      }

      col_types[zip_col] = 'bar';
      col_axes[zip_col] = 'y2';
    }
    new_line_columns.forEach(function(col) {
      legend_names[col] = zip;
    });
    new_line_columns.forEach(function(col) {
      colors[col] = cm_cat20(index*2-1);
    });
    new_bar_columns.forEach(function(col) {
      colors[col] = cm_cat20(index*2);
    });
    if(chart == undefined) {
      chart = c3.generate({
        bindto: docid,
        data: {
          json: json_array,
          keys: {
            x: x,
            value: new_line_columns.concat(new_bar_columns),
          },
          types: col_types,
          axes: col_axes,
          names: legend_names,
          colors: colors,
        },
        legend: {
          hide: new_bar_columns,
        },
        axis: {
            y: { 
              label: new_line_columns.toString(),
            },
            y2: { 
              show: true,
              label: new_bar_columns.toString(),
            }
        },
        zoom: {
          enabled: true
        },
      });
    }else{
      chart.legend.hide(new_bar_columns);
      chart.load({
        json: json_array,
        keys: {
          x: x,
          value: new_line_columns.concat(new_bar_columns),
        },
        types: col_types,
        axes: col_axes,
        names: legend_names,
        colors: colors,
      });
      chart.groups(bar_groups);
    }
  }
  return chart;
}
