class Property < ActiveRecord::Base
  self.table_name = 'property_addresses'
  self.primary_key = 'pin'
  alias_attribute :id, :pin

  has_many :transactions, :primary_key => "pin", :foreign_key => "pin", :class_name => "Transaction" 
  has_one :closest, class_name: 'PropertyClosestSchool', foreign_key: 'pin'
  has_one :elem, through: :closest, foreign_key: 'pin'
  has_one :middle, through: :closest, foreign_key: 'pin'
  has_one :high, through: :closest, foreign_key: 'pin'

  scope :valid, lambda {
    where("lon is not null and lat is not null")
  }

	scope :within_area, -> (polygon) {
		where(%{
			ST_Within(
				ST_GeomFromText('POINT(' || lat || ' ' || lon || ')'),
				ST_MakePolygon(ST_GeomFromText('LINESTRING(%s)'))
			)
		} % [polygon.join(', ')])
	}

  def schools
    self.closest.schools
  end

end

class PropertyGrid
  include Datagrid

  scope do
    Property
  end

  filter(:zip, :string)
  filter(:city, :string)

  # Columns
  column(:pin, header: 'parcel#', html: true) do |p|
    #link_to(p.pin, p)
    p.pin
  end
  column(:year_built)
  column(:sqft)
  column(:eval_land)
  column(:eval_imps)
end
