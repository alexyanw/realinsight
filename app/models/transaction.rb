class Transaction < ActiveRecord::Base
		self.primary_key = 'pin'
    belongs_to :property_address, :primary_key => "pin", :foreign_key  => "pin", :class_name => "PropertyAddress" 
end


