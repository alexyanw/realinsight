function locateAddress(location, geometry) {
	layer_properties.add({
		id: 1,
		properties: location,
		geometry: geometry 
	});

}

function queryScope(scope) {
  var req_data = {scope: scope};
  $.ajax({
    url: '/properties/query',
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json',
    data: req_data,
    success: function(properties) {
      update_property_list(properties);
      update_property_brief(properties[0]);
      properties.forEach(function(f){
        layer_properties.add({
          id: f.pin,
          properties: f,
          geometry: {lat: parseFloat(f.lat), lng: parseFloat(f.lon)}
        });
      });
    },
    error: function(jqXHR, textStatus, errorThrown ) { 
      console.log(textStatus); 
    }
  });

  $.ajax({
    url: '/schools',
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json',
    data: req_data,
    success: function(data) {
			data.forEach(function(f) {
        //var latlng = {lat: f.latitude, lng: f.longitude};
        var latlng = {lat: f.wkb_geometry.coordinates[1], lng: f.wkb_geometry.coordinates[0]};
        layer_schools.add({
          id: f.id,
          properties: f,
          geometry: latlng
        });
			});
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('accessing /schools', errorThrown);
    }
  });
}

function initEventCustom() {
  layer_properties.addListener('click', onClickProperty);
  layer_schools.addListener('click', onClickSchool);

  google.maps.event.addListener(g_map, "click", onClickMap);
}

function onClickProperty(event) {
  if(g_selectedProperty == null){
    layer_properties.setVisible(false);
    layer_schools.setVisible(false);
  }
  g_selectedProperty = event.feature;
  update_property_brief(g_selectedProperty.f);
  layer_properties.revertStyle(); // HACK
  layer_properties.overrideStyle(g_selectedProperty, {visible: true});

  initInfoWindow('PROPERTY');
  updatePropertySchools(g_selectedProperty);
  updateInfoProperty({brief: g_selectedProperty.f});
}

function showInfoProperty(feature) {
  var div = '<h5><b>property facts</b></h5>';
  ['address', 'num_bath', 'num_bed', 'pool', 'sqft', 'year_built' ].forEach(function(k) {
    div += k+ ": " +feature.f[k] + "<br>";
  });

  g_infobox.setContent(div);
  g_infobox.setPosition(feature.getGeometry().get());
  g_infobox.setOptions({pixelOffset: new google.maps.Size(0,-15)});
  g_infobox.open(g_map);
}

function onClickSchool(event) {
  g_selectedSchool = event.feature;
  layer_properties.overrideStyle(g_selectedSchool, {visible: true});

  initInfoWindow('SCHOOL');
  updateInfoSchool(g_selectedSchool);
}

function updateInfoSchool(feature) {
  var div = '';
  ['name', 'address', 'grade', 'school_type', 'rating' ].forEach(function(k) {
    div += k+ ": " +feature.f[k] + "<br>";
  });

  var domId = 'school-brief';
  document.getElementById(domId).innerHTML = div;
}

function formatSchool(schools_raw) {
  var schools = [];
  schools_raw.forEach(function(s) {
    var position = {lat: s.wkb_geometry.coordinates[1], lng: s.wkb_geometry.coordinates[0]};
    var school = {id: s.id, latlng: position, name: s.school, address: s.address, grade: s.grade, type: s.school_type, rating: s.rating};
		schools.push(school);
	});
  return schools;
}

function updatePropertySchools(feature) {
  var property = feature.f
  var url = '/properties/' + property.pin + '/schools';
  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    success: function(data) {
			// NOTE: only need school ids, layer_schools to getFeatureById
      var schools = formatSchool(data);
      renderSchoolDirection(schools, feature);
    },
    error: function(jqXHR, textStatus, errorThrown ) {
      console.log(url, jqXHR,errorThrown);
    }
  });
}

function highlightSchool(schoolid) {
  var school = layer_schools.getFeatureById(schoolid);
  layer_schools.overrideStyle(school, {visible:true});
}

function renderSchoolDirection(schools, src_marker=null) {
  g_arraySchoolPointers.forEach(function(p) {
    p.setMap(null);
  });
  g_arraySchoolPointers = [];

  layer_schools.revertStyle();
  var propPosition = src_marker.getGeometry().get();
  var bounds = new google.maps.LatLngBounds(propPosition);
  for(var i in schools) {
    var s = schools[i];
    highlightSchool(s.id);
    bounds.extend(s.latlng);

    var polyline = new google.maps.Polyline({
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: g_map,
      });
    var path = [propPosition, s.latlng];
    polyline.setPath(path);

    g_arraySchoolPointers.push(polyline);
  }

  g_map.fitBounds(bounds);
  calcRoutes(propPosition, schools);
}

function calcRoute(start, end, travelMode='DRIVING') {
  var request = {
    origin: start,
    destination: end,
    travelMode: travelMode,
    drivingOptions: {
      departureTime: new Date(Date.now()),  // for the time N milliseconds from now.
      trafficModel: 'optimistic'
    }
  };
  g_directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      var time = result.routes[0].legs[0].duration_in_traffic.text;
      renderDirection(result);
    }
  });
}
function renderDirection(result) { 
  var directionsRenderer = new google.maps.DirectionsRenderer(); 
  directionsRenderer.setMap(g_map); 
  directionsRenderer.setDirections(result); 
  g_directionsRenderers.push(directionsRenderer);
}

function calcRoutes(start, schools, travelMode='DRIVING') {
  var dests = [];
  schools.forEach(function(s) {
    dests.push(s.latlng);
	});

  var service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [start],
      destinations: dests,
      travelMode: travelMode,
      //transitOptions: TransitOptions,
      drivingOptions: {
        departureTime: new Date(Date.now()),  // for the time N milliseconds from now.
        trafficModel: 'optimistic'
      },
      //unitSystem: UnitSystem,
      avoidHighways: true,
      avoidTolls: true,
    }, parseRoutes.bind(null, schools));
}

function parseRoutes(schools, response, status) {
  if (status == 'OK') {
    var routes = response.rows[0].elements;
    var dest_routes = [];
    for(var i in schools) {
      dest_routes.push(Object.assign({id: schools[i].id, name: schools[i].name}, routes[i]));
		}
    updateInfoProperty({routes: dest_routes});
  }else{
    handleMapError('Google map DistanceMatrix service failed');
  }
}

function onClickMap(event) {
  g_infobox.close();

  g_selectedProperty = null;
  g_arraySchoolPointers.forEach(function(p) {
    p.setMap(null);
  });
  g_arraySchoolPointers = [];

  resetRoutes();

  layer_schools.setVisible(true);
  layer_properties.setVisible(true);
  layer_properties.revertStyle();
  layer_schools.revertStyle();

  initInfoWindow();
}

function resetRoutes() {
  g_directionsRenderers.forEach(function(r) {
    r.setMap(null);
  });
  g_directionsRenderers = [];
}

function initInfoWindow(feature=null) {
  var div;
  if(feature==null) {
    div = '<h5><b>Property/School facts</b></h5>';
    div += 'Hover over a property or school<br>';
    div += 'Click a property to see its details<br>';
  }else if(feature == 'PROPERTY') {
    div = '<h5><b>Property facts</b></h5>';
    div += "<div id='property-brief'></div>";
    div += "<div id='property-routes'></div>";
  }else if(feature == 'SCHOOL') {
    div = '<h5><b>School facts</b></h5>';
    div += "<div id='school-brief'></div>";
  }
  g_infoControl.innerHTML = div;

}

function updateInfoProperty(attributes) {
  for(var a in attributes) {
		var domId = 'property-' + a;
    if(a == 'routes') {
      var content = '<table>';
      content += '<tr><th>POI</th><th>distance</th><th>duration</th><th>duration_in_traffic</th></tr>';
      attributes[a].forEach(function(r){
        content += '<tr>';
        content += "<td><span class='school-route' school_id="+ r.id +">" + r.name+'</span></td>';
        content += "<td><span value='"+ r.id +"'>" + r.distance.text+'</span></td>';
        content += "<td><span value='"+ r.id +"'>" + r.duration.text+'</span></td>';
        content += "<td><span value='"+ r.id +"'>" + r.duration_in_traffic.text+'</span></td>';
        content += '</tr>';
      });
      content += '</table>'

      document.getElementById(domId).innerHTML = content;
      $('.school-route').click(onClickSchoolRoute);
		}else if(a=='brief') {
      var feature = attributes[a];
      $('#property-brief').val(feature.pin);
      var content = "<table>";
      content += '<tr><th>attribute</th><th>value</th></tr>';
			['address', 'num_bath', 'num_bed', 'pool', 'sqft', 'year_built' ].forEach(function(k) {
        content += '<tr><td>'+k+'</td><td>'+feature[k]+'</td></tr>';
			});
      document.getElementById(domId).innerHTML = content;
		}
	}
}

function onClickSchoolRoute(e) {
  var school_id = $(this).attr('school_id');
  var prop_id = $('#property-brief').val();
  var school = layer_schools.getFeatureById(school_id);
  var prop = layer_properties.getFeatureById(prop_id);
  calcRoute(prop.getGeometry().get(), school.getGeometry().get());
}

