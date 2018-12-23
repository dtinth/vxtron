class LogItem < Struct.new(:timestamp, :seconds, :price_factor)
  def price
    0.006 * price_factor.to_i * (seconds.to_i / 15r).ceil
  end
  def date
    timestamp.sub(/T.*/, '')
  end
end

log_items = File.readlines('speech-stats.log', chomp: true)
  .map { |c| LogItem.new(*c.split("\t")) }

log_items.group_by(&:date).sort.each do |date, items|
  puts "#{date}\t#{(33 * items.map(&:price).sum).round} THB"
end

puts "TOTAL     \t#{(33 * log_items.map(&:price).sum).round} THB"
