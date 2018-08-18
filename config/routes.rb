Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'properties#index'

  resources :properties do
    get 'query', on: :collection
    get 'search', on: :collection
    get 'schools'
    resources :transactions
  end

  match ':controller(/:action(/:id))', via: [:get, :post]
end
