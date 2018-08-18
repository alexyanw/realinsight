var iconSchoolBase = '/';

var iconSchools = {
  private: {
    icon: iconSchoolBase + 'school-elem.png'
  },
  elementary: {
    icon: iconSchoolBase + 'school-elem.png'
  },
  middle: {
    icon: iconSchoolBase + 'school-middle.png'
  },
  high: {
    icon: iconSchoolBase + 'school-high.png'
  }
};

function setSchoolStyle() {
  if(layer_schools == undefined) { return; }

  layer_schools.setStyle(function(feature) {
    var type = 'elementary';
    if (feature.getProperty('middle')) {
      type = 'middle';
    }else if (feature.getProperty('high')) {
      type = 'high';
    }
    return /** @type {!google.maps.Data.StyleOptions} */({
      icon: {
        url: iconSchools[type].icon,
        scaledSize: new google.maps.Size(25,25)
      },
      //strokeWeight: 2
    });
  });
}
