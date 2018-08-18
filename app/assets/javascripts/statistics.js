function init_charts() {
  for(let i=0;i<3;i++) {
    var select_chartid = '#select_chart' + i.toString();
    var chart = default_charts[i];
    var chart_config = chart_configs[chart];
    var groups = [];
    for(var group in opt_groups) {
      var options = [];
      for(var j in opt_groups[group]) {
        var opt = opt_groups[group][j];
        if(chart == opt) {
          options.push("<option selected='selected'>" + opt + "</option>");
        }else{
          options.push("<option>" + opt + "</option>");
        }
      }
      groups.push("<optgroup label='"+group+"'>" + options.join('') +"</optgroup>");
    }

    $(select_chartid).append(groups.join("")).selectmenu({
      change: function( event, data ) {
        let title = data.item.value;
        let region = $(select_chartid).prev().text();
        var config = chart_configs[title];

        var chartid = '#chart_' + i.toString();
        var zipcodes = Array.from(g_selected_zips).map(d => d.feature.id);
        if(zipcodes.length == 0) {
          zipcodes = [''];
        }
        if(config.tier) {
          query_zip(zipcodes, {tier: true, chartid: chartid});
        }else if(config.school) {
          stats = {}
          for(var j in zipcodes) {
            stats[zipcodes[j]] = g_school_stats.filter(function(d) {return d.zip == zipcodes[j];}); 
          }
          update_chart(chartid, config, stats);
        }else{
          stats = {}
          for(var j in zipcodes) {
            stats[zipcodes[j]] = g_zip_stats.filter(function(d) {return d.zip == zipcodes[j];}); 
          }
          update_chart(chartid, config, stats);
        }
      }
    });
  }
}

function update_viz(zipcodes) {
  query_zip(zipcodes);
  query_zip(zipcodes, {tier: true});
  query_school(zipcodes);
}

function update_charts(zip_stats, kwargs={}) {
  for(var i=0;i<3;i++) {
    var chartid = '#chart_' + i.toString();
    if(kwargs.chartid && chartid != kwargs.chartid) { continue; }

    var title = $('#select_chart'+i.toString()).val();
    var config = chart_configs[title];
    if(config.tier != kwargs.tier) { continue; }
    if(config.school != kwargs.school) { continue; }
    update_chart(chartid, config, zip_stats);
  }
}

function update_chart(docid, config, stats) {
  var attributes = config['attributes'] || ['median_sqft_price'];
  var chart = undefined;

  if(config.chart == 'line_bar') {
    draw_line_bar_chart(docid, stats, 'year', attributes, ['volume']);
  }else if(config.chart == 'line') {
    if(config.tier) {
      var zip_stats = {};
      for(var zip in stats) {
        zip_stats[zip] = pivot_table(stats[zip], 'tile', attributes[0]);
        if(config.yoy) {
          zip_stats[zip] = get_yoy(stats[zip], ['bottom', 'middle', 'top']);
        }
      }
      if(config.yoy) {
        draw_line_chart_zip(docid, zip_stats, 'year', ['bottom', 'middle', 'top'], 'ratio');
      }else{
        draw_line_chart_zip(docid, zip_stats, 'year', ['bottom', 'middle', 'top']);
      }
    }else{
      if(config.yoy) {
        var zip_stats = {};
        for(var zip in stats) {
          zip_stats[zip] = get_yoy(stats[zip], attributes);
        }
        draw_line_chart_zip(docid, zip_stats, 'year', attributes, 'ratio');
      }else{
        draw_line_chart_zip(docid, stats, 'year', attributes);
      }
    }
  }
}

function query_zip(zips, kwargs={}) {
  var req_data = {month: 0};
  var zip = zips[zips.length-1];
  if(!kwargs.tier) {
    if(g_zip_stats != undefined) {
      var stats = {};
      for(i in zips) {
        var zip = zips[i];
        var zip_stat = g_zip_stats.filter(function(d) { return d['zip'] == zip });
        stats[zip] = zip_stat;
      }
      console.log(stats, kwargs);
      update_charts(stats, kwargs);
      return;
    }
    req_data.tile = 0;
  }else{
    if(g_zip_tier_stats[zip] != undefined) {
      var zip_stat = g_zip_tier_stats[zip];
      var stats = {};
      stats[zip] = zip_stat;
      update_charts(stats, kwargs);
      return;
    }
    req_data.zip = zip;
  }
  $.ajax({
    url: '/statistics/query',
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json',
    data: req_data,
    success: function(data) {
      if(kwargs.tier) {
        tier_stats = data.filter(function(d) {
          if(d['tile'] == 0){ return false; }
          return true;
        });
        var zip_stat = tier_stats.filter(function(d) { return d['zip'] == zip });
        g_zip_tier_stats[zip] = zip_stat;
      }else if(req_data.zip == undefined) {
        g_zip_stats = data;
        update_choropleth();
      }
      query_zip(zips, kwargs);
    }
  });
}

function query_zip_cluster() {
  $.ajax({
    url: "/json/zip_clusters.json",
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      g_zip_clusters = data;
    }
  });
}

function query_school(zipcodes) {
  if(g_school_stats != undefined) {
    if(zipcodes == []) { return; }
    var stats = {};
    for(i in zipcodes) {
      zipcode = zipcodes[i];
      stats[zipcode] = g_school_stats.filter(function(d) {return d.zip == zipcode;});
    }
    
    update_charts(stats, {school: true});
    return;
  }

  $.ajax({
    url: '/statistics/school',
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json',
    data: {},
    success: function(data) {
      g_school_stats = data;
    }
  });
}


function get_yearly(stats) {
  return d3.nest().key(function(d){ return d.year; })
    .rollup(function(leaves){ return {
      volume: d3.sum(leaves, function(d){ return d.volume; }),
      avg: d3.mean(leaves, function(d){ return d.avg; }),
     }
    })
    .entries(stats).map(function(d){
       return { year: d.key, volume: d.values['volume'], avg: d.values['avg']};
    });
}

function pivot_table(jsonarray, pvt_col, val_col) {
  var nester = d3.nest()
    .key(function (d) { return d.year; })
    .rollup(function (values) {
       var sortedValues = values.sort(function (x, y) { 
        return x[pvt_col] < y[pvt_col] ? -1 : x[pvt_col] > y[pvt_col] ? 1 : 0; 
       });
			 var tiers = ['', 'bottom', 'middle', 'top'];
       var pivoted = sortedValues.map(function(d) {
         return {name: tiers[d[pvt_col]], value: d[val_col]};
       });
       return pivoted;
       //return Array.prototype.concat.apply([], [pivotedX]);
    });
    
  var nestedData = nester.entries(jsonarray);
  var pivotedData = [];
  
  nestedData.forEach(function (kv) {
    // HACK: hardcode year as key
		var obj = { year: kv.key, };
		kv.values.forEach(function (d){
			obj[d.name] = d.value;
		})
		pivotedData.push(obj);
  });
  return pivotedData;
}

function get_yoy(stats, columns) {
  yoy = []
  for(var i=1;i<stats.length;i++) {
    var obj = {year: stats[i]['year']};
    for(var j in columns) {
      col = columns[j];
      obj[col] = (stats[i][col] / stats[i-1][col] - 1.0).toFixed(3);
    } 
    yoy.push(obj);
  }
  return yoy;
}

colormap_bivariate_3x3 = [
  ['#64acbe', '#627f8c', '#574249'],
  ['#b0d5df', '#ad9ea5', '#985356'],
  ['#e8e8e8', '#e4acac', '#c85a5a'],
];

var colormap_background = undefined;
var g_cm_range = []
var colormap_circle = undefined;
var g_cm_circle_range = []
var cluster_features = ['cluster_on_sqft_price', 'cluster_on_volume'];

var school_features = [
                       'private_count', 
                       'avg_elementary_rating', 'elementary_count',
                       'avg_middle_rating', 'middle_count',
                       'avg_high_rating', 'high_count'];


function get_year_stats(year, attribute) {
  var stats = g_zip_stats;
  if(cluster_features.includes(attribute)) {
    var clusters = [];
    var zips = g_zip_clusters[attribute];
    for(zip in zips) {
      var obj = {zip: zip};
      obj[attribute] = zips[zip];
      clusters.push(obj);
    }
    return clusters;
  }
  if(school_features.includes(attribute)) {
    stats = g_school_stats;
  }
  
  year_stats = stats.filter(function(d) { return d.year == year && d.zip != ''; });
  return year_stats;
}

var g_school_stats, g_zip_stats;
var g_zip_clusters;
var g_zip_tier_stats = {};

var chart_configs = {
  'median price & volume': {
      'attributes': ['median_sqft_price'],
      'chart': 'line_bar',
  },
  'median price YoY': {
      'attributes': ['median_sqft_price'],
      'chart': 'line',
      'yoy': true,
  },
  '3 tiers median price': {
      'attributes': ['median_sqft_price'],
      'chart': 'line',
      'tier': true,
  },
  'volume': {
      'attributes': ['volume'],
      'chart': 'line',
  },
  'total school count': {
      'attributes': ['school_count'],
      'chart': 'line',
      'school': true,
  },
  'elementary school count': {
      'attributes': ['elementary_count'],
      'chart': 'line',
      'school': true,
  },
  'middle school count': {
      'attributes': ['middle_count'],
      'chart': 'line',
      'school': true,
  },
  'elementary school count': {
      'attributes': ['elementary_count'],
      'chart': 'line',
      'school': true,
  },

};
var opt_groups = {
  'transaction': Object.keys(chart_configs).filter(function(t){ return chart_configs[t].school == undefined }),
  'school': Object.keys(chart_configs).filter(function(t){ return chart_configs[t].school==true }),
}

var default_charts = Object.keys(chart_configs).slice(0, 3);


