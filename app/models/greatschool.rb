class Greatschool < ActiveRecord::Base
  self.primary_key = 'id'

  geocoded_by :address   # can also be an IP address
  reverse_geocoded_by :latitude, :longitude

  after_validation :geocode 
end


