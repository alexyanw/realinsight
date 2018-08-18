class PropertySchoolElementary < ActiveRecord::Base
  belongs_to :property
  belongs_to :school
end
