class School < ActiveRecord::Base
  self.primary_key = 'id'
 #attr_accessor :latitude
 #attr_accessor :longitude
  def latitude
    self.wkb_geometry.coordinates[1]
  end
  def longitude
    self.wkb_geometry.coordinates[0]
  end

	scope :within_area, -> (polygon) {
		where(%{
			ST_Within(
        ST_GeomFromText('POINT(' || ST_Y(wkb_geometry) || ' ' || ST_X(wkb_geometry) || ')'),
				ST_MakePolygon(ST_GeomFromText('LINESTRING(%s)'))
			)
		} % [polygon.join(', ')])
	}
end

class SchoolGrid
  include Datagrid

  scope do
    School
  end

  filter(:zip, :string)
  filter(:city, :string)
  filter(:doctype, :string)
  filter(:soctype, :string)
  filter(:gsoffered, :string)

  # Columns
  column(:zip)
  column(:city)
  column(:doctype)
  column(:soctype)
  column(:gsoffered)
  column(:street, header: 'address')
end
