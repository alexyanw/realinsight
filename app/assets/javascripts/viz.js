function initEventCustom() {
  layer_zips.addListener('mouseover', onZip);
  layer_zips.addListener('mouseout', outZip);
  layer_zips.addListener('click', clickZip);
  //google.maps.event.addListener(g_map, "click", onClickMap);
}

function onZip(e) {
  var layer = e.feature;
  updateInfoControl(layer.f);
  layer_zips.overrideStyle(layer, {
      strokeWeight: 3,
      strokeColor: '#3388ff',
      strokeOpacity: 1.0,
  });
}

function outZip(e) {
  var layer = e.feature;
  updateInfoControl();
  if(!g_selected_zips.has(layer)) {
    layer_zips.revertStyle(layer);
  }
}

function clickZip(e) {
  var layer = e.feature;
  if(g_selected_zips.has(layer)) {
    layer_zips.revertStyle(layer);
    g_selected_zips.delete(layer);
  }else{
    g_selected_zips.add(layer);
    layer_zips.overrideStyle(layer, {
        strokeWeight: 3,
        strokeColor: '#3388ff',
        strokeOpacity: 1.0,
    });
  }

  var zipcodes = Array.from(g_selected_zips).map(d => d.getId());
  if(zipcodes.length == 0) {
    $('.zip-title').text('county');
  }else{
    $('.zip-title').text(zipcodes.join(', '));
  }
  update_viz(zipcodes);
}


function updateInfoControl(zip=null) {
  var div;
  if(zip==null) {
    div = '<h5><b>zip facts</b></h5>';
    div += 'Hover over a zip<br>';
    div += 'Click a zip to see its statistics<br>';
  }else{
    var year = slider_year.slider('value');
    div = '<h5><b>zip facts ' + year.toString() + '</b></h5>';
    var zipcode = zip.ZIP;
    var community = zip.PONAME;
    div += 'zip: ' + zipcode + "<br/>";
    div += 'community: ' + community + "<br/>";
    if(g_zip_stats != undefined) { 
      var zip_stats = g_zip_stats.filter(function(d) { return d.year == year && d.zip == zipcode; })[0];
      for(var k in zip_stats) {
        if(['year', 'zip', 'month', 'tile'].includes(k)) { continue; }
        div += k+ ": " +zip_stats[k] + "<br>";
      }
    }
    if(g_school_stats != undefined) {
      div += '<h6><b>school facts</b></h6>';
      var school_stats = g_school_stats.filter(function(d) { return d.year == year && d.zip.toString() == zipcode.toString(); })[0];
      for(var k in school_stats) {
        if(['year', 'zip'].includes(k)) { continue; }
        div += k+ ": " +school_stats[k] + "<br>";
      }
    }
  }
  //g_infoControl.innerHTML = div;
  g_infoControl.load(div);
}

function updateSideControl(zip=null) {
  var div = '';
  g_sideControl.innerHTML = div;
}

function update_choropleth(year=2017) {
  set_zip_background_at(year, choropleth_attrs.background);
  set_zip_circle_at(year, choropleth_attrs.circle_size, choropleth_attrs.circle_color);
  update_choropleth_legend();
}

function update_choropleth_legend() {
  var content = '';
  var step_count = 4;

  if(choropleth_attrs.background.length <= 1 && colormap_background) {
    min = g_cm_range[0]
    max = g_cm_range[1]
    if(max - min <= step_count){ step_count = max - min; }
    step = (max - min) / step_count;

    content += "<table style='margin: 10px'>";
    content += "<tr><th colspan=2>" + choropleth_attrs.background[0] + "</th></tr>";
    for(var i=0;i<=step_count;i++) {
      content += '<tr>';
      var value = Math.floor(min + step*i);
      var color = colormap_background(value);
      content += '<td><i style="background:' + color + '"></i></td>' ;
      content += '<td>' + value + '</td>';
      content += '<tr>';
    }
    content += "</table>";
  } else if(choropleth_attrs.background.length > 1 || colormap_background == undefined) {
    var tiers = ['low', 'med', 'high'];
    var content = "<table style='margin: 10px'>";
    content += "<tr><th></th><th></th><th colspan=3>";
    content += choropleth_attrs.background[0] + "</th></tr>";
    content += "<tr><td></td><td></td><td>low</td><td>med</td><td>high</td></tr>";
    for (var i = 0; i < colormap_bivariate_3x3.length; i++) {
      content += '<tr>';
      if(i==0) {
        content += '<td rowspan=3 style="padding-top: 40px;max-width: 50px;">';
        content += '<div style="transform: rotate(-90deg);font-weight: bold;margin:-20px">' + choropleth_attrs.background[1] + '</div></td>';
      }
      content += '<td>' + tiers[i] + '</td>';
      for (var j = 0; j < colormap_bivariate_3x3.length; j++) {
        content += '<td><i style="background:' + colormap_bivariate_3x3[i][j] + '"></i></td> ';
      }
      content += '</tr>';
    }
    content += '</table>';
  }

  if(choropleth_attrs.circle_color && colormap_circle) {
    min = g_cm_circle_range[0];
    max = g_cm_circle_range[1];
    step = (max - min) / 4;
    content += "<table style='margin: 10px'>";
    content += "<tr><th colspan=2>" + choropleth_attrs.circle_color + "</th></tr>";
    for(var i=0;i<5;i++) {
      content += '<tr>';
      var value = Math.floor(min + step*i);
      var color = colormap_circle(value);
      content += '<td><i style="background:' + color + '"></i></td>' ;
      content += '<td>' + value + '</td>';
      content += '<tr>';
    }
    content += "</table>";
  } 
  g_legendControl.load(content);
}

function set_zip_background(zip, color) {
  var id = (typeof(zip) == 'string')? parseInt(zip) : zip;
  var layer = layer_zips.getFeatureById(id)
  if(layer == null) { return; }
  layer.setProperty('color', color);
}

function set_zip_background_at(year, attributes) {
  has_zips = new Set([]);
  if(attributes == undefined) { return; }
  if(attributes.length == 1) {
    var attribute = attributes[0];
    var year_stats = get_year_stats(year, attribute);
    min = d3.min(year_stats, function(d){ return parseFloat(d[attribute]); }); 
    max = d3.max(year_stats, function(d){ return parseFloat(d[attribute]); }); 
    g_cm_range = [min, max];
    if(cluster_features.includes(attribute)) {
      colormap_background = d3.scale.category10();
    }else{
      colormap_background = d3.scale.linear().domain(g_cm_range).range(["yellow", "red"]);
    }

    year_stats.forEach(function(zip_stat) {
      color = (zip_stat[attribute] == undefined) ? undefined : colormap_background(zip_stat[attribute]);
      set_zip_background(zip_stat.zip, color);
      has_zips.add(zip_stat.zip);
    });
  }else if(attributes.length == 2) {
    var year_stats1 = get_year_stats(year, attributes[0]);
    var year_stats2 = get_year_stats(year, attributes[1]);
    attr1_values = year_stats1.map(d => parseFloat(d[attributes[0]]) ); 
    attr2_values = year_stats2.map(d => parseFloat(d[attributes[1]]) ); 
    attr1_cm = d3.scale.quantile().domain(attr1_values).range([0, 1, 2]);
    attr2_cm = d3.scale.quantile().domain(attr2_values).range([0, 1, 2]);
    year_stats1 = d3.map(year_stats1, function(d) { return d.zip});
    year_stats2 = d3.map(year_stats2, function(d) { return d.zip});

    zips1 = year_stats1.keys();
    zips2 = year_stats2.keys();
    has_zips = new Set(zips1.concat(zips2));
    Array.from(has_zips).forEach(function(zip) {
      zip_stat1 = year_stats1.get(zip);
      zip_stat2 = year_stats2.get(zip);
      attr1 = (zip_stat1 == undefined) ? 0 : zip_stat1[attributes[0]];
      attr2 = (zip_stat2 == undefined) ? 0 : zip_stat2[attributes[1]];
      let color1 = attr1_cm(attr1);
      let color2 = attr2_cm(attr2);
      let color = colormap_bivariate_3x3[color2][color1];
      set_zip_background(zip, color);
    });
  }

  layer_zips.forEach(function(layer) {
    var zip = layer.getId();
    if(!has_zips.has(zip)){
      layer.setProperty('color', null);
    }
  });
}

function set_zip_circle(zip, style=undefined) {
  var id = (typeof(zip) == 'string')? parseInt(zip) : zip;
  var layer = g_choroplethCircles[id]
  if(layer == undefined) { return; }
  if(style == undefined) {
    layer.setOptions(CHOROPLETH_CIRCLE_STYLE);
    return;
  }
  style = Object.assign({}, CHOROPLETH_CIRCLE_STYLE, {radius: style.size, fillColor: style.color});
  layer.setOptions(style);
}

function set_zip_circle_at(year, attr_size='', attr_color='') {
	var sizemap_range = [400, 2000]
  var zip_encode = {};
  if(attr_size != '') {
    var year_stats = get_year_stats(year, attr_size);
    min = d3.min(year_stats, function(d){ return parseFloat(d[attr_size]); }); 
    max = d3.max(year_stats, function(d){ return parseFloat(d[attr_size]); }); 
    sizemap = d3.scale.linear().domain([min,max]).range(sizemap_range);

    year_stats.forEach(function(zip_stat) {
      size = (zip_stat[attr_size] == undefined) ? 0 : sizemap(zip_stat[attr_size]);
      zip_encode[parseInt(zip_stat.zip)] = {size: size};
    });
  }
  if(attr_color != '') {
    var year_stats = get_year_stats(year, attr_color);
    min = d3.min(year_stats, function(d){ return parseFloat(d[attr_color]); }); 
    max = d3.max(year_stats, function(d){ return parseFloat(d[attr_color]); }); 
		g_cm_circle_range = [min, max]
    colormap_circle = d3.scale.linear().domain([min, max]).range(["yellow", "red"]);

    year_stats.forEach(function(zip_stat) {
      color = (zip_stat[attr_color] == undefined) ? undefined : colormap_circle(zip_stat[attr_color]);
      let zipcode = parseInt(zip_stat.zip);
      if(zipcode in zip_encode) {
        zip_encode[zipcode].color = color;
      }else{
				let size = (attr_size == '') ? 8 : 0;
        zip_encode[zipcode] = {size: size, color: color};
      }
    });
  }
  for(var zip in zip_encode) {
    set_zip_circle(zip, zip_encode[zip]);
  }

  layer_zips.forEach(function(layer) {
    var zip = layer.getId();
    if(!(zip in zip_encode)){
      set_zip_circle(zip, undefined);
    }
  });
}

