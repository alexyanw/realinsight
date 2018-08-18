class PropertyClosestSchool < ActiveRecord::Base
  belongs_to :property
  belongs_to :elem, class_name: 'School', foreign_key: 'elem_id'
  belongs_to :middle, class_name: 'School', foreign_key: 'middle_id'
  belongs_to :high, class_name: 'School', foreign_key: 'high_id'

  def schools
    School.find([self.elem_id, self.middle_id, self.high_id])
  end
end

