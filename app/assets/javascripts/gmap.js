var tab = '<%=@tab%>';
$('#navbar-links li > a').each(function(i) {
  if($(this).text() == tab) {
    $(this).parent().addClass('active');
  }
});

var g_map;
var g_geocoder;
var g_infobox;
var FT_ZIP = '1Lae-86jeUDLmA6-8APDDqazlTOy1GsTXh28DAkw';
var FT_CITY = '1Gls9mSLiDhYBjGs94VzEiZxeEj32lqR7Qc2Zg4k';
var FT_COUNTY = '1xdysxZ94uUFIit9eXmnw1fYc6VcQiXhceFd_CVKa';

var CHOROPLETH_CIRCLE_STYLE = {
	strokeColor: 'green',
	strokeOpacity: 1,
	strokeWeight: 1,
	fillColor: 'green',
	fillOpacity: 0.5,
  radius: 0,
  zIndex: 10,
};

function initialize() {
  initializeMap();
  initializeEvents();
}

function initializeMap() {
  var pos = {lat: 32.881214, lng: -117.237661};

  g_map = new google.maps.Map(document.getElementById('map'), {
    center: pos,
    zoom: 12,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
  });
  g_infobox = new google.maps.InfoWindow;

  g_geocoder = new google.maps.Geocoder;

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      g_infobox.setPosition(pos);
      g_infobox.setContent('Location found.');
      g_infobox.open(g_map);
      g_map.setCenter(pos);
    }, function() {
      handleLocationError(true, g_infobox, g_map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, g_infobox, g_map.getCenter());
  }

  if(initMapCustom != undefined) {
    initMapCustom(pos);
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  var msg = browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.';
  handleMapError(msg, infoWindow, pos);
}

function handleMapError(message, infoWindow=null, pos=null) {
  if(pos==null){ pos = g_map.getCenter(); }
  if(infoWindow==null) { infoWindow = g_infobox; }
  infoWindow.setPosition(pos);
  infoWindow.setContent(message);
  infoWindow.open(g_map);
}


function initializeEvents() {
  google.maps.event.addListener(g_map, "click", function () {
    g_infobox.close();
  });

  if(initEventCustom != undefined) {
    initEventCustom();
  }
}

function codeAddress(address, callback) {
  g_geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == 'OK') {
      var location = {};
      results[0].address_components.forEach(function(c){
        var type = c.types[0];
        location[type] = c.long_name;
      });
      location.formatted_address = results[0].formatted_address;
      callback(location, results[0].geometry.location);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function geoDecode(latlng, callback) {
  g_geocoder.geocode({'location': latlng}, function(results, status) {
    if (status === 'OK') {
      if (results[0]) {
        var location = {};
        results[0].address_components.forEach(function(c){
          var type = c.types[0];
          location[type] = c.long_name;
        });
        if(callback != undefined) {
          callback(location);
        }
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}

function MapControl(map, position, id='', className='') {
  var controlDiv = document.createElement('div');
  controlDiv.index = 1;
  map.controls[position].push(controlDiv);

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  //controlUI.title = 'Click to recenter the map';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlContent = document.createElement('div');
  controlContent.id = id;
  controlContent.className = className;
  controlUI.appendChild(controlContent);

  this.control_ = controlContent;
}

MapControl.prototype.load = function(div) {
  this.control_.innerHTML = div;
};

//query eg. "SELECT 'Store Name', Coordinates, delivery FROM 15UY2pgiz8sRkq37p2TaJd64U7M_2HDVqHT3Quw";
function queryFusionTableV1(query){
  query = encodeURIComponent(query);
  var gvizQuery = new google.visualization.Query(
    'http://www.google.com/fusiontables/gvizdata?tq=' + query);

  gvizQuery.send(function(response) {
    var numRows = response.getDataTable().getNumberOfRows();

    for (var i = 0; i < numRows; i++) {
			//HACK get first column
      var kml = response.getDataTable().getValue(i, 0); 
			var kmlLayer = new google.maps.KmlLayer(kml, {
				suppressInfoWindows: true,
				preserveViewport: false,
				map: g_map,
			});
    }
  });
}

function queryFusionTable(datalayer, query, columns, id, callback=null){
  encodedQuery = encodeURIComponent(query);
	var url = ['https://www.googleapis.com/fusiontables/v2/query'];
	url.push('?sql=' + encodedQuery);
	url.push('&key=AIzaSyCat5L7Jvs62BXVdezyIzW9FuJNGXVRPak');
	url.push('&callback=?');

	$.ajax({
		url: url.join(''),
		dataType: 'jsonp',
		success: function (data) {
			var rows = data['rows'];
			createGeometryFromKML(datalayer, rows, columns, id);
			if(callback) {
				callback(datalayer);
			}
		}
	});
}

function createGeometryFromKML(datalayer, rows, columns, id) {
	for (var i in rows) {
    var feature = {};
    for(var j in columns) {
      feature[columns[j]] = rows[i][j];
    }
		var geom = feature.geometry;
		var newCoordinates = [];
		if (geom.geometries) {
			for (var j in geom.geometries) {
				newCoordinates.push(constructNewCoordinates(geom.geometries[j]));
			}
		}else if(geom.geometry) {
			newCoordinates = [constructNewCoordinates(geom.geometry)];
		}else{
			continue;
		}

		var polygon = new google.maps.Data.Polygon(newCoordinates);
    feature.color = null;
    datalayer.add({
      id: feature[id],
      properties: feature,
      geometry: polygon,
    });
	}
}


function constructNewCoordinates(polygon) {
	var newCoordinates = [];
	var coordinates = polygon['coordinates'][0];
	for (var i in coordinates) {
		newCoordinates.push(
			new google.maps.LatLng(coordinates[i][1], coordinates[i][0]));
	}
	return newCoordinates;
}

function loadChoroplethCircles(datalayer){
  datalayer.forEach(function(layer){
		var center = {lat: layer.getProperty('latitude'), lng: layer.getProperty('longitude')}; 
		var style = Object.assign({}, CHOROPLETH_CIRCLE_STYLE, {center: center, map: g_map});
    g_choroplethCircles[layer.getId()] = new google.maps.Circle(style);
  });

}

function createZipOverlay(map=null) {
  var ZIP_MAPTYPE_ID = 'ziphybrid';
  imageMapType = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
      if (zoom < 5 || zoom > 18 ) {
        return null;
      }
      if (zoom <= 13 ) {
        var url = "http://storage.googleapis.com/zipmap/tiles/" + zoom + "/" + coord.x + "/" + coord.y + ".png" ;
        return url ;
      }
      var server = coord.x % 6 ;
      var url = "http://ts" + server + ".usnaviguide.com/tileserver.pl?X=" + coord.x + "&Y=" + coord.y + "&Z=" + zoom + "&T=" + tskey + "&S=Z1001" ;
      return url ;
    },
    tileSize: new google.maps.Size(256, 256),
    opacity:.9,
    name: ZIP_MAPTYPE_ID
  });
  if(map != null) {
		map.overlayMapTypes.push(imageMapType);
	}
  return imageMapType;
}

function applyStyle(map, layer, geo) {
	var columnStyle = COLUMN_STYLES[column];
	var styles = [];

	for (var i in columnStyle) {
		var style = columnStyle[i];
		styles.push({
			where: generateWhere(column, style.min, style.max),
			polygonOptions: {
				fillColor: style.color,
				fillOpacity: style.opacity ? style.opacity : 0.8
			}
		});
	}

	layer.set('styles', styles);
}

// Create the where clause
function generateWhere(columnName, low, high) {
	var whereClause = [];
	whereClause.push("'");
	whereClause.push(columnName);
	whereClause.push("' >= ");
	whereClause.push(low);
	whereClause.push(" AND '");
	whereClause.push(columnName);
	whereClause.push("' < ");
	whereClause.push(high);
	return whereClause.join('');
}

// jsaction extract and dispatcher
const eventContract = new jsaction.EventContract();

// Events will be handled for all elements under this container.
eventContract.addContainer(document.getElementById('main-container'));

// Register the event types we care about.
eventContract.addEvent('click');
eventContract.addEvent('dblclick');
eventContract.addEvent('mouseover');

// Create the dispatcher and connect it to the event contract. The event contract queues events
// while the dispatcher takes events and dispatches them to the correct handler.
const dispatcher = new jsaction.Dispatcher();
eventContract.dispatchTo(dispatcher.dispatch.bind(dispatcher));

const togglePane = function(flow) {
  $('.widget-pane').toggleClass('widget-pane-collapsed');
};

dispatcher.registerHandlers(
		'pane',                       // the namespace
		null,                            // handler object
		{                                // action map
			'toggle' : togglePane,
		});

