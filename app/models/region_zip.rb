class RegionZip < ActiveRecord::Base
  has_many :timeseries, :primary_key => "regionname", :foreign_key => "regionname", :class_name => 'ZipTimeseries'
end


